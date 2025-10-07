// Copyright 2025 The Kubermatic Kubernetes Platform contributors.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//     http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

import {AfterViewInit, Component, EventEmitter, forwardRef, Input, OnDestroy, OnInit, Output} from '@angular/core';
import {
  FormArray,
  FormBuilder,
  FormGroup,
  NG_VALIDATORS,
  NG_VALUE_ACCESSOR,
  Validators,
} from '@angular/forms';
import {ComboboxControls} from '@shared/components/combobox/component';
import {ClusterSpecService} from '@core/services/cluster-spec';
import {PresetsService} from '@core/services/wizard/presets';
import {LoadBalancerClass} from '@shared/entity/cluster';
import {OpenstackNetwork, OpenstackSubnet} from '@shared/entity/provider/openstack';
import {NodeProvider} from '@shared/model/NodeProviderConstants';
import {BaseFormValidator} from '@shared/validators/base-form.validator';
import _ from 'lodash';
import {EMPTY, merge, Observable, onErrorResumeNext, Subject} from 'rxjs';
import {catchError, debounceTime, filter, map, switchMap, takeUntil, tap} from 'rxjs/operators';
import {CredentialsType, OpenstackCredentialsTypeService} from '../service';

// Enums for state labels
enum NetworkStateLabel {
  Ready = 'Network ID',
  Loading = 'Loading...',
  Empty = 'No Networks Available',
}

enum FloatingNetworkStateLabel {
  Ready = 'Floating Network ID',
  Loading = 'Loading...',
  Empty = 'No Floating Networks Available',
}

enum SubnetStateLabel {
  Ready = 'Subnet ID',
  Loading = 'Loading...',
  Empty = 'No Subnets Available',
}

enum MemberSubnetStateLabel {
  Ready = 'Member Subnet ID',
  Loading = 'Loading...',
  Empty = 'No Member Subnets Available',
}

enum FloatingSubnetStateLabel {
  Ready = 'Floating Subnet ID',
  Loading = 'Loading...',
  Empty = 'No Floating Subnets ID Available',
}

enum FloatingSubnetStateByNameLabel {
  Ready = 'Floating Subnet Name',
  Loading = 'Loading...',
  Empty = 'No Floating Subnets Name Available',
}

interface SharedNetworkState {
  networks: OpenstackNetwork[];
  floatingNetworks: OpenstackNetwork[];
  networksLoading: boolean;
  floatingNetworksLoading: boolean;
}

// Per LB Class state 
interface LoadBalancerClassState {
  subnets: OpenstackSubnet[];
  memberSubnets: OpenstackSubnet[];
  floatingSubnets: OpenstackSubnet[];
  floatingSubnetTags: string[];
  subnetsLoading: boolean;
  memberSubnetsLoading: boolean;
  floatingSubnetsLoading: boolean;
}

@Component({
  selector: 'km-wizard-openstack-loadbalancer-classes',
  templateUrl: './template.html',
  styleUrls: ['./style.scss'],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => LoadBalancerClassesComponent),
      multi: true,
    },
    {
      provide: NG_VALIDATORS,
      useExisting: forwardRef(() => LoadBalancerClassesComponent),
      multi: true,
    },
  ],
  standalone: false,
})
export class LoadBalancerClassesComponent extends BaseFormValidator implements OnInit, AfterViewInit, OnDestroy {
  private readonly _debounceTime = 500;
  
  @Input() loadBalancerClasses: LoadBalancerClass[];
  @Output() loadBalancerClassesChange = new EventEmitter<LoadBalancerClass[]>();
  
  private _sharedNetworkState: SharedNetworkState = {
    networks: [],
    floatingNetworks: [],
    networksLoading: false,
    floatingNetworksLoading: false,
  };
  
  private _floatingNetworkLoadSubject = new Subject<void>();
  private _floatingSubnetLoadSubject = new Map<number, Subject<string>>();
  private _networkLoadSubject = new Subject<void>();
  private _subnetLoadSubject = new Map<number, Subject<string>>();
  private _loadBalancerClassStates: Map<number, LoadBalancerClassState> = new Map();
  
  private _expandedClasses: Set<number> = new Set();
  
  isPresetSelected = false;

  private _domain = '';
  private _username = '';
  private _password = '';
  private _project = '';
  private _projectID = '';
  private _applicationCredentialID = '';
  private _applicationCredentialSecret = '';
  private _preset = '';

  protected _unsubscribe = new Subject<void>();

  constructor(
    private readonly _builder: FormBuilder,
    private readonly _presets: PresetsService,
    private readonly _clusterSpecService: ClusterSpecService,
    private readonly _credentialsTypeService: OpenstackCredentialsTypeService
  ) {
    super('LoadBalancer Classes');
  }

  get loadBalancerClassesArray(): FormArray {
    return this.form.get('loadBalancerClasses') as FormArray;
  }

  ngOnInit(): void {
    this.initForm();

    if (!this.loadBalancerClasses) {
      this.loadBalancerClasses = [];
    }

    this.setLoadBalancerClasses(this.loadBalancerClasses);
    this._initNetworkSetup();
    
    this._updateLoadBalancerClasses();

    // Setup Preset Handling
    this._presets.presetDetailedChanges.pipe(takeUntil(this._unsubscribe)).subscribe(preset => {
      this.isPresetSelected = !!preset;
      const providerSettings = preset?.providers.find(provider => provider.name === NodeProvider.OPENSTACK);

      if (providerSettings?.isCustomizable) {
        const presetLoadBalancerClasses = providerSettings.openstack?.loadBalancerClasses || [];
        this.setLoadBalancerClasses(presetLoadBalancerClasses);
      }
    });
    
    merge(
      this._clusterSpecService.clusterChanges,
      this._credentialsTypeService.credentialsTypeChanges,
      this._presets.presetChanges
    )
      .pipe(filter(_ => this._clusterSpecService.provider === NodeProvider.OPENSTACK))
      .pipe(debounceTime(this._debounceTime))
      .pipe(
        tap(_ => {
          if (!this._presets.preset && this._preset) {
            this._clearCredentials();
          }
          if (!this._hasRequiredCredentials() && !this.isPresetSelected) {
            this._clearAllData();
          }
        })
      )
      .pipe(filter(_ => this._hasRequiredCredentials() || this.isPresetSelected))
      .pipe(filter(_ => this._areCredentialsChanged()))
      .pipe(takeUntil(this._unsubscribe))
      .subscribe(() => {
        this._networkLoadSubject.next();
        this._floatingNetworkLoadSubject.next();
      });

  }

  ngAfterViewInit(): void {
    if (this.loadBalancerClassesArray.length > 0) {
      this.setDefaultClassName(0);
    }
  }

  ngOnDestroy(): void {
    this._unsubscribe.next();
    this._unsubscribe.complete();
    this._networkLoadSubject.complete();
    this._floatingNetworkLoadSubject.complete();
    this._subnetLoadSubject.forEach(trigger => trigger.complete());
    this._floatingSubnetLoadSubject.forEach(trigger => trigger.complete());
  }


  getNetworkDisplayName(_index: number, id: string): string {
    if (!id) return '';
    const network = this._sharedNetworkState.networks.find(n => n.id === id);
    return network ? `${network.name} (ID: ${network.id})` : id;
  }

  getSubnetDisplayName(index: number, id: string): string {
    if (!id) return '';
    const classState = this._loadBalancerClassStates.get(index);
    const subnet = classState?.subnets.find(s => s.id === id);
    return subnet ? `${subnet.name} (${subnet.id})` : id;
  }

  getFloatingNetworkDisplayName(_index: number, id: string): string {
    if (!id) return '';
    const network = this._sharedNetworkState.floatingNetworks.find(n => n.id === id);
    return network ? `${network.name} (ID: ${network.id})` : id;
  }

  getFloatingSubnetDisplayName(index: number, id: string): string {
    if (!id) return '';
    const classState = this._loadBalancerClassStates.get(index);
    const subnet = classState?.floatingSubnets.find(s => s.id === id);
    return subnet ? `${subnet.name} (${subnet.id})` : id;
  }

  getMemberSubnetDisplayName(index: number, id: string): string {
    if (!id) return '';
    const classState = this._loadBalancerClassStates.get(index);
    const subnet = classState?.memberSubnets.find(s => s.id === id);
    return subnet ? `${subnet.name} (${subnet.id})` : id;
  }

  getNetworksForClass(_index: number): OpenstackNetwork[] {
    return this._sharedNetworkState.networks;
  }

  getSubnetsForClass(index: number): OpenstackSubnet[] {
    return this._loadBalancerClassStates.get(index)?.subnets || [];
  }

  getMemberSubnetsForClass(index: number): OpenstackSubnet[] {
    return this._loadBalancerClassStates.get(index)?.memberSubnets || [];
  }

  getFloatingNetworksForClass(_index: number): OpenstackNetwork[] {
    return this._sharedNetworkState.floatingNetworks;
  }

  getFloatingSubnetsForClass(index: number): OpenstackSubnet[] {
    return this._loadBalancerClassStates.get(index)?.floatingSubnets || [];
  }

  getFloatingSubnetTagsForClass(index: number): string[] {
    return this._loadBalancerClassStates.get(index)?.floatingSubnetTags || [];
  }

  // State label getters using enums
  getNetworksLabel(_index: number): string {
    if (this._sharedNetworkState.networksLoading) return NetworkStateLabel.Loading;
    return this._sharedNetworkState.networks.length > 0 ? NetworkStateLabel.Ready : NetworkStateLabel.Empty;
  }

  getFloatingNetworksLabel(_index: number): string {
    if (this._sharedNetworkState.floatingNetworksLoading) return FloatingNetworkStateLabel.Loading;
    return this._sharedNetworkState.floatingNetworks.length > 0 ? FloatingNetworkStateLabel.Ready : FloatingNetworkStateLabel.Empty;
  }

  getSubnetsLabel(index: number): string {
    const classState = this._loadBalancerClassStates.get(index);
    if (classState?.subnetsLoading) return SubnetStateLabel.Loading;
    return classState?.subnets.length > 0 ? SubnetStateLabel.Ready : SubnetStateLabel.Empty;
  }

  getMemberSubnetsLabel(index: number): string {
    const classState = this._loadBalancerClassStates.get(index);
    if (classState?.memberSubnetsLoading) return MemberSubnetStateLabel.Loading;
    return classState?.memberSubnets.length > 0 ? MemberSubnetStateLabel.Ready : MemberSubnetStateLabel.Empty;
  }

  getFloatingSubnetsLabel(index: number): string {
    const classState = this._loadBalancerClassStates.get(index);
    if (classState?.floatingSubnetsLoading) return FloatingSubnetStateLabel.Loading;
    return classState?.floatingSubnets.length > 0 ? FloatingSubnetStateLabel.Ready : FloatingSubnetStateLabel.Empty;
  }

  getFloatingSubnetsLabelByName(index: number): string {
    const classState = this._loadBalancerClassStates.get(index);
    if (classState?.floatingSubnetsLoading) return FloatingSubnetStateByNameLabel.Loading;
    return classState?.floatingSubnets.length > 0 ? FloatingSubnetStateByNameLabel.Ready : FloatingSubnetStateByNameLabel.Empty;
  }

  addLoadBalancerClass(): void {
    const index = this.loadBalancerClassesArray.length;
    const classForm = this.createLoadBalancerClassFormGroup();

    this.loadBalancerClassesArray.push(classForm);

    // Initialize class-dependent state only
    this._loadBalancerClassStates.set(index, {
      subnets: [],
      memberSubnets: [],
      floatingSubnets: [],
      floatingSubnetTags: [],
      subnetsLoading: false,
      memberSubnetsLoading: false,
      floatingSubnetsLoading: false,
    });

    this._expandedClasses.add(index);

    if (this._hasRequiredCredentials() || this.isPresetSelected) {
      this._networkLoadSubject.next();
      this._floatingNetworkLoadSubject.next();
    }

    this.setDefaultClassName(index);
    this._updateLoadBalancerClasses();
  }

  removeLoadBalancerClass(index: number): void {
    this.loadBalancerClassesArray.removeAt(index);
    this._loadBalancerClassStates.delete(index);

    const subnetTrigger = this._subnetLoadSubject.get(index);
    if (subnetTrigger) {
      subnetTrigger.complete();
      this._subnetLoadSubject.delete(index);
    }
    const floatingSubnetTrigger = this._floatingSubnetLoadSubject.get(index);
    if (floatingSubnetTrigger) {
      floatingSubnetTrigger.complete();
      this._floatingSubnetLoadSubject.delete(index);
    }

    // Clean up tree state
    this._expandedClasses.delete(index);

    // Reindex remaining classes in tree state (shift indices down)
    const newExpandedClasses = new Set<number>();

    this._expandedClasses.forEach(classIndex => {
      if (classIndex > index) {
        newExpandedClasses.add(classIndex - 1);
      } else if (classIndex < index) {
        newExpandedClasses.add(classIndex);
      }
    });

    this._expandedClasses = newExpandedClasses;

    this._updateLoadBalancerClasses();
  }

  canRemove(): boolean {
    return this.loadBalancerClassesArray.length > 1;
  }

  private setDefaultClassName(index: number): void {
    if (index < 0 || index >= this.loadBalancerClassesArray.length) {
      return;
    }

    const defaultClassName = `Default-LoadBalancer-Class-${index + 1}`;
    const formGroup = this.loadBalancerClassesArray.at(index);

    // Only set default name if it's empty
    if (!formGroup.get('name')?.value) {
      formGroup.get('name')?.patchValue(defaultClassName);
      this.onNameChange(index, defaultClassName);
    }
  }

  private initForm(): void {
    this.form = this._builder.group({
      loadBalancerClasses: this._builder.array([this.createLoadBalancerClassFormGroup()]),
    });
  }

  private createLoadBalancerClassFormGroup(): FormGroup {
    return this._builder.group({
      name: ['', [Validators.required, Validators.minLength(1)]],
      config: this._builder.group({
        floatingNetworkID: [''],
        floatingSubnetID: [''],
        floatingSubnet: [''],
        floatingSubnetTags: [[]],
        networkID: [''],
        subnetID: [''],
        memberSubnetID: [''],
      }),
    });
  }

  private setLoadBalancerClasses(loadBalancerClasses: LoadBalancerClass[]): void {
    this.loadBalancerClassesArray.clear();
    this._loadBalancerClassStates.clear();

    // Clear tree state when setting new classes
    this._expandedClasses.clear();

    if (loadBalancerClasses.length === 0) {
      this.addLoadBalancerClass();
      return;
    }

    loadBalancerClasses.forEach((lbClass, index) => {
      const formGroup = this.createLoadBalancerClassFormGroup();
      
      // Ensure all config values are strings, not null
      const config = {
        floatingNetworkID: lbClass.config?.floatingNetworkID || '',
        floatingSubnetID: lbClass.config?.floatingSubnetID || '',
        floatingSubnet: lbClass.config?.floatingSubnet || '',
        floatingSubnetTags: Array.isArray(lbClass.config?.floatingSubnetTags)
          ? lbClass.config.floatingSubnetTags
          : lbClass.config?.floatingSubnetTags?.split(',').filter(tag => tag.trim()) || [],
        networkID: lbClass.config?.networkID || '',
        subnetID: lbClass.config?.subnetID || '',
        memberSubnetID: lbClass.config?.memberSubnetID || '',
      };
      
      const patchValue = {
        name: lbClass.name || '',
        config,
      };
      
      formGroup.patchValue(patchValue);
      this.loadBalancerClassesArray.push(formGroup);

      // Initialize class-dependent state
      this._loadBalancerClassStates.set(index, {
        subnets: [],
        memberSubnets: [],
        floatingSubnets: [],
        floatingSubnetTags: [],
        subnetsLoading: false,
        memberSubnetsLoading: false,
        floatingSubnetsLoading: false,
      });

      // Expand the first class by default when loading existing classes
      if (index === 0) {
        this._expandedClasses.add(index);
      }
    });
  }

  private _updateLoadBalancerClasses(): void {
    const loadBalancerClasses = this._getCurrentLoadBalancerClasses();
    this.loadBalancerClassesChange.emit(loadBalancerClasses);
  }

  private _getCurrentLoadBalancerClasses(): LoadBalancerClass[] {
    const formValue = this.form.get('loadBalancerClasses')?.value || [];
    return formValue
      .filter((lbClass: any) => lbClass.name && lbClass.name.trim())
      .map((lbClass: any) => ({
        name: lbClass.name || '',
        config: {
          floatingNetworkID: this._extractComboboxValue(lbClass.config?.floatingNetworkID),
          floatingSubnetID: this._extractComboboxValue(lbClass.config?.floatingSubnetID),
          floatingSubnet: this._extractComboboxValue(lbClass.config?.floatingSubnet),
          floatingSubnetTags: Array.isArray(lbClass.config?.floatingSubnetTags) 
            ? lbClass.config.floatingSubnetTags.join(',') 
            : lbClass.config?.floatingSubnetTags || '',
          networkID: this._extractComboboxValue(lbClass.config?.networkID),
          subnetID: this._extractComboboxValue(lbClass.config?.subnetID),
          memberSubnetID: this._extractComboboxValue(lbClass.config?.memberSubnetID),
        },
      }));
  }

  private _extractComboboxValue(value: any): string {
    if (!value) return '';
    if (typeof value === 'string') return value;
    if (typeof value === 'object' && value[ComboboxControls.Select]) {
      return value[ComboboxControls.Select] || '';
    }
    return '';
  }

  onNetworkChange(index: number, networkId: string): void {
    // Update form control directly
    const formGroup = this.loadBalancerClassesArray.at(index) as FormGroup;
    const configGroup = formGroup?.get('config') as FormGroup;
    
    if (configGroup) {
      configGroup.get('networkID')?.patchValue(networkId || '');
      
      if (!networkId) {
        // Clear related subnet values when network is cleared
        configGroup.get('subnetID')?.patchValue('');
        configGroup.get('memberSubnetID')?.patchValue('');
      }
    }

    const classState = this._loadBalancerClassStates.get(index);
    if (classState) {
      if (!networkId) {
        classState.subnets = [];
        classState.memberSubnets = [];
      } else {
        this._setupNetworkChangeListener(index).next(networkId);
      }
    }
    
    this._updateLoadBalancerClasses();
  }

  onFloatingNetworkChange(index: number, floatingNetworkId: string): void {
    // Update form control directly
    const formGroup = this.loadBalancerClassesArray.at(index) as FormGroup;
    const configGroup = formGroup?.get('config') as FormGroup;
    
    if (configGroup) {
      configGroup.get('floatingNetworkID')?.patchValue(floatingNetworkId || '');
      
      if (!floatingNetworkId) {
        // Clear related floating subnet values when floating network is cleared
        configGroup.get('floatingSubnetID')?.patchValue('');
        configGroup.get('floatingSubnet')?.patchValue('');
        configGroup.get('floatingSubnetTags')?.patchValue([]);
      }
    }

    const classState = this._loadBalancerClassStates.get(index);
    if (classState) {
      if (!floatingNetworkId) {
        classState.floatingSubnets = [];
        classState.floatingSubnetTags = [];
      } else {
        this._setupFloatingNetworkChangeListener(index).next(floatingNetworkId);
      }
    }
    
    this._updateLoadBalancerClasses();
  }

  onFloatingSubnetIDChange(index: number, floatingSubnetId: string): void {
    const formGroup = this.loadBalancerClassesArray.at(index) as FormGroup;
    const configGroup = formGroup?.get('config') as FormGroup;
    configGroup?.get('floatingSubnetID')?.patchValue(floatingSubnetId || '');
    this._updateLoadBalancerClasses();
  }

  onFloatingSubnetChange(index: number, floatingSubnet: string): void {
    const formGroup = this.loadBalancerClassesArray.at(index) as FormGroup;
    const configGroup = formGroup?.get('config') as FormGroup;
    configGroup?.get('floatingSubnet')?.patchValue(floatingSubnet || '');
    this._updateLoadBalancerClasses();
  }

  onSubnetIDChange(index: number, subnetId: string): void {
    const formGroup = this.loadBalancerClassesArray.at(index) as FormGroup;
    const configGroup = formGroup?.get('config') as FormGroup;
    configGroup?.get('subnetID')?.patchValue(subnetId || '');
    this._updateLoadBalancerClasses();
  }

  onMemberSubnetIDChange(index: number, memberSubnetId: string): void {
    const formGroup = this.loadBalancerClassesArray.at(index) as FormGroup;
    const configGroup = formGroup?.get('config') as FormGroup;
    configGroup?.get('memberSubnetID')?.patchValue(memberSubnetId || '');
    this._updateLoadBalancerClasses();
  }

  onNameChange(index: number, name: string): void {
    const formGroup = this.loadBalancerClassesArray.at(index) as FormGroup;
    formGroup?.get('name')?.patchValue(name || '');
    this._updateLoadBalancerClasses();
  }

  onFloatingSubnetTagsChange(index: number, tags: string[]): void {
    const formGroup = this.loadBalancerClassesArray.at(index) as FormGroup;
    const configGroup = formGroup?.get('config') as FormGroup;
    configGroup?.get('floatingSubnetTags')?.patchValue(tags);
    this._updateLoadBalancerClasses();
  }

  // Tree node expansion/collapse methods
  toggleClassExpansion(index: number): void {
    if (this._expandedClasses.has(index)) {
      this._expandedClasses.delete(index);
    } else {
      this._expandedClasses.add(index);
    }
  }

  isClassExpanded(index: number): boolean {
    return this._expandedClasses.has(index);
  }

  canAddLoadBalancerClass(): boolean {
    if (this.loadBalancerClassesArray.length === 0) {
      return true;
    }

    const lastIndex = this.loadBalancerClassesArray.length - 1;
    const lastFormGroup = this.loadBalancerClassesArray.at(lastIndex);
    const name = lastFormGroup?.get('name')?.value;

    return !!name && name.trim().length > 0;
  }



  private _clearAllData(): void {
    this._sharedNetworkState.networks = [];
    this._sharedNetworkState.floatingNetworks = [];
    this._sharedNetworkState.networksLoading = false;
    this._sharedNetworkState.floatingNetworksLoading = false;
    
    this._loadBalancerClassStates.forEach(classState => {
      classState.subnets = [];
      classState.memberSubnets = [];
      classState.floatingSubnets = [];
      classState.floatingSubnetTags = [];
      classState.subnetsLoading = false;
      classState.memberSubnetsLoading = false;
      classState.floatingSubnetsLoading = false;
    });
  }

  private _initNetworkSetup(): void {
    this._floatingNetworkLoadSubject
      .pipe(
        tap(() => this._sharedNetworkState.floatingNetworksLoading = true),
        switchMap(() => this._floatingNetworkListObservable()),
        takeUntil(this._unsubscribe)
      )
      .subscribe({
        next: networks => {
          this._sharedNetworkState.floatingNetworks = networks;
          this._sharedNetworkState.floatingNetworksLoading = false;
        },
        error: () => {
          this._sharedNetworkState.floatingNetworks = [];
          this._sharedNetworkState.floatingNetworksLoading = false;
        },
      });

      this._networkLoadSubject
      .pipe(
        tap(() => this._sharedNetworkState.networksLoading = true),
        switchMap(() => this._networkListObservable()),
        takeUntil(this._unsubscribe)
      )
      .subscribe({
        next: networks => {
          this._sharedNetworkState.networks = networks.filter(network => !network.external);
          this._sharedNetworkState.networksLoading = false;
        },
        error: () => {
          this._sharedNetworkState.networks = [];
          this._sharedNetworkState.networksLoading = false;
        },
      });
  }

  private _setupNetworkChangeListener(index: number): Subject<string> {
    let trigger = this._subnetLoadSubject.get(index);
    if (!trigger) {
      trigger = new Subject<string>();
      this._subnetLoadSubject.set(index, trigger);
      
      trigger
        .pipe(
          tap(() => {
            const classState = this._loadBalancerClassStates.get(index);
            if (classState) {
              classState.subnetsLoading = true;
              classState.memberSubnetsLoading = true;
            }
          }),
          switchMap(networkId => 
            merge(
              this._subnetIDListObservable(networkId).pipe(map(subnets => ({type: 'subnets', subnets}))),
              this._memberSubnetListObservable(networkId).pipe(map(subnets => ({type: 'memberSubnets', subnets})))
            )
          ),
          takeUntil(this._unsubscribe)
        )
        .subscribe({
          next: result => {
            const classState = this._loadBalancerClassStates.get(index);
            if (!classState) return;
            
            if (result.type === 'subnets') {
              classState.subnets = result.subnets;
              classState.subnetsLoading = false;
            } else if (result.type === 'memberSubnets') {
              classState.memberSubnets = result.subnets;
              classState.memberSubnetsLoading = false;
            }
          },
          error: () => {
            const classState = this._loadBalancerClassStates.get(index);
            if (classState) {
              classState.subnets = [];
              classState.memberSubnets = [];
              classState.subnetsLoading = false;
              classState.memberSubnetsLoading = false;
            }
          },
        });
    }
    return trigger;
  }

  private _setupFloatingNetworkChangeListener(index: number): Subject<string> {
    let trigger = this._floatingSubnetLoadSubject.get(index);
    if (!trigger) {
      trigger = new Subject<string>();
      this._floatingSubnetLoadSubject.set(index, trigger);
      
      // Set up floating subnet loading stream for this class
      trigger
        .pipe(
          tap(() => {
            const classState = this._loadBalancerClassStates.get(index);
            if (classState) {
              classState.floatingSubnetsLoading = true;
            }
          }),
          switchMap(floatingNetworkId => this._floatingSubnetListObservable(floatingNetworkId)),
          takeUntil(this._unsubscribe)
        )
        .subscribe({
          next: subnets => {
            const classState = this._loadBalancerClassStates.get(index);
            if (classState) {
              classState.floatingSubnets = subnets;
              classState.floatingSubnetsLoading = false;
              // Extract unique tags from all subnets
              const allTags = subnets.flatMap(subnet => subnet.tags || []);
              classState.floatingSubnetTags = [...new Set(allTags)];
            }
          },
          error: () => {
            const classState = this._loadBalancerClassStates.get(index);
            if (classState) {
              classState.floatingSubnets = [];
              classState.floatingSubnetTags = [];
              classState.floatingSubnetsLoading = false;
            }
          },
        });
    }
    return trigger;
  }


  private _hasRequiredCredentials(): boolean {
    switch (this._credentialsTypeService.credentialsType) {
      case CredentialsType.Default:
        return this._hasUserCredentials() && this._hasProject();
      case CredentialsType.Application:
        return this._hasApplicationCredentials();
      default:
        return false;
    }
  }

  private _hasUserCredentials(): boolean {
    return (
      !!this._clusterSpecService.cluster.spec.cloud.openstack?.username &&
      !!this._clusterSpecService.cluster.spec.cloud.openstack?.password
    );
  }

  private _hasApplicationCredentials(): boolean {
    return (
      !!this._clusterSpecService.cluster.spec.cloud.openstack?.applicationCredentialID &&
      !!this._clusterSpecService.cluster.spec.cloud.openstack?.applicationCredentialSecret
    );
  }

  private _hasProject(): boolean {
    return (
      !!this._clusterSpecService.cluster.spec.cloud.openstack &&
      (!!this._clusterSpecService.cluster.spec.cloud.openstack.project ||
        !!this._clusterSpecService.cluster.spec.cloud.openstack.projectID)
    );
  }

  private _areCredentialsChanged(): boolean {
    let credentialsChanged = false;

    if (this._preset !== this._presets.preset) {
      this._preset = this._presets.preset;
      credentialsChanged = true;
    }

    if (this._clusterSpecService.cluster.spec.cloud.openstack?.domain !== this._domain) {
      this._domain = this._clusterSpecService.cluster.spec.cloud.openstack.domain;
      credentialsChanged = true;
    }

    if (this._clusterSpecService.cluster.spec.cloud.openstack?.username !== this._username) {
      this._username = this._clusterSpecService.cluster.spec.cloud.openstack.username;
      credentialsChanged = true;
    }

    if (this._clusterSpecService.cluster.spec.cloud.openstack?.password !== this._password) {
      this._password = this._clusterSpecService.cluster.spec.cloud.openstack.password;
      credentialsChanged = true;
    }

    if (this._clusterSpecService.cluster.spec.cloud.openstack?.project !== this._project) {
      this._project = this._clusterSpecService.cluster.spec.cloud.openstack.project;
      credentialsChanged = true;
    }

    if (this._clusterSpecService.cluster.spec.cloud.openstack?.projectID !== this._projectID) {
      this._projectID = this._clusterSpecService.cluster.spec.cloud.openstack.projectID;
      credentialsChanged = true;
    }

    if (
      this._clusterSpecService.cluster.spec.cloud.openstack?.applicationCredentialID !== this._applicationCredentialID
    ) {
      this._applicationCredentialID = this._clusterSpecService.cluster.spec.cloud.openstack.applicationCredentialID;
      credentialsChanged = true;
    }

    if (
      this._clusterSpecService.cluster.spec.cloud.openstack?.applicationCredentialSecret !==
      this._applicationCredentialSecret
    ) {
      this._applicationCredentialSecret =
        this._clusterSpecService.cluster.spec.cloud.openstack.applicationCredentialSecret;
      credentialsChanged = true;
    }

    return credentialsChanged;
  }

  private _clearCredentials(): void {
    this._domain = '';
    this._username = '';
    this._password = '';
    this._project = '';
    this._projectID = '';
    this._applicationCredentialID = '';
    this._applicationCredentialSecret = '';
    this._preset = '';

    // Clear all load balancer classes when credentials are cleared
    this._clearAllLoadBalancerClasses();
  }

  private _clearAllLoadBalancerClasses(): void {
    while (this.loadBalancerClassesArray.length !== 0) {
      this.loadBalancerClassesArray.removeAt(0);
    }

    // Clear all states
    this._loadBalancerClassStates.clear();
    this._clearAllData();
    this._expandedClasses.clear();
    this._updateLoadBalancerClasses();
  }

  private _networkListObservable(): Observable<OpenstackNetwork[]> {
    return this._presets
      .provider(NodeProvider.OPENSTACK)
      .credential(this._presets.preset)
      .domain(this._clusterSpecService.cluster.spec.cloud.openstack.domain)
      .username(this._clusterSpecService.cluster.spec.cloud.openstack.username)
      .password(this._clusterSpecService.cluster.spec.cloud.openstack.password)
      .datacenter(this._clusterSpecService.cluster.spec.cloud.dc)
      .project(this._clusterSpecService.cluster.spec.cloud.openstack.project)
      .projectID(this._clusterSpecService.cluster.spec.cloud.openstack.projectID)
      .applicationCredentialID(this._clusterSpecService.cluster.spec.cloud.openstack.applicationCredentialID)
      .applicationCredentialPassword(this._clusterSpecService.cluster.spec.cloud.openstack.applicationCredentialSecret)
      .networks()
      .pipe(map(networks => _.sortBy(networks, n => n.name.toLowerCase())))
      .pipe(catchError(() => onErrorResumeNext(EMPTY)));
  }

  private _floatingNetworkListObservable(): Observable<OpenstackNetwork[]> {
    return this._presets
      .provider(NodeProvider.OPENSTACK)
      .credential(this._presets.preset)
      .domain(this._clusterSpecService.cluster.spec.cloud.openstack.domain)
      .username(this._clusterSpecService.cluster.spec.cloud.openstack.username)
      .password(this._clusterSpecService.cluster.spec.cloud.openstack.password)
      .datacenter(this._clusterSpecService.cluster.spec.cloud.dc)
      .project(this._clusterSpecService.cluster.spec.cloud.openstack.project)
      .projectID(this._clusterSpecService.cluster.spec.cloud.openstack.projectID)
      .applicationCredentialID(this._clusterSpecService.cluster.spec.cloud.openstack.applicationCredentialID)
      .applicationCredentialPassword(this._clusterSpecService.cluster.spec.cloud.openstack.applicationCredentialSecret)
      .networks()
      .pipe(
        map(networks => {
          // Append mock data to networks coming from backend
          // Todo: will be removed
          const mockNetworks = [
            {
              id: '45d48cb4-73a7-4504-b06b-3f9c53576a05',
              name: 'ext-net-1 (MOCK)',
              external: true,
            },
          ];
          const allNetworks = [...networks, ...mockNetworks];
          const floatingNetworks = allNetworks.filter(network => network.external === true);
          return _.sortBy(floatingNetworks, n => n.name?.toLowerCase() ?? '');
        })
      )
      .pipe(
        catchError(error => {
          console.error('Error in floating networks observable:', error);
          return onErrorResumeNext(EMPTY);
        })
      );
  }

  private _subnetIDListObservable(networkId: string): Observable<OpenstackSubnet[]> {
    return this._presets
      .provider(NodeProvider.OPENSTACK)
      .credential(this._presets.preset)
      .domain(this._clusterSpecService.cluster.spec.cloud.openstack.domain)
      .username(this._clusterSpecService.cluster.spec.cloud.openstack.username)
      .password(this._clusterSpecService.cluster.spec.cloud.openstack.password)
      .project(this._clusterSpecService.cluster.spec.cloud.openstack.project)
      .projectID(this._clusterSpecService.cluster.spec.cloud.openstack.projectID)
      .applicationCredentialID(this._clusterSpecService.cluster.spec.cloud.openstack.applicationCredentialID)
      .applicationCredentialPassword(this._clusterSpecService.cluster.spec.cloud.openstack.applicationCredentialSecret)
      .datacenter(this._clusterSpecService.cluster.spec.cloud.dc)
      .subnets(networkId)
      .pipe(map(subnets => _.sortBy(subnets, s => s.name.toLowerCase())))
      .pipe(catchError(() => onErrorResumeNext(EMPTY)));
  }

  private _memberSubnetListObservable(networkId: string): Observable<OpenstackSubnet[]> {
    return this._presets
      .provider(NodeProvider.OPENSTACK)
      .credential(this._presets.preset)
      .domain(this._clusterSpecService.cluster.spec.cloud.openstack.domain)
      .username(this._clusterSpecService.cluster.spec.cloud.openstack.username)
      .password(this._clusterSpecService.cluster.spec.cloud.openstack.password)
      .project(this._clusterSpecService.cluster.spec.cloud.openstack.project)
      .projectID(this._clusterSpecService.cluster.spec.cloud.openstack.projectID)
      .applicationCredentialID(this._clusterSpecService.cluster.spec.cloud.openstack.applicationCredentialID)
      .applicationCredentialPassword(this._clusterSpecService.cluster.spec.cloud.openstack.applicationCredentialSecret)
      .datacenter(this._clusterSpecService.cluster.spec.cloud.dc)
      .memberSubnets(networkId)
      .pipe(map(subnets => _.sortBy(subnets, s => s.name.toLowerCase())))
      .pipe(catchError(() => onErrorResumeNext(EMPTY)));
  }

  private _floatingSubnetListObservable(floatingNetworkId: string): Observable<OpenstackSubnet[]> {
    return this._presets
      .provider(NodeProvider.OPENSTACK)
      .credential(this._presets.preset)
      .domain(this._clusterSpecService.cluster.spec.cloud.openstack.domain)
      .username(this._clusterSpecService.cluster.spec.cloud.openstack.username)
      .password(this._clusterSpecService.cluster.spec.cloud.openstack.password)
      .project(this._clusterSpecService.cluster.spec.cloud.openstack.project)
      .projectID(this._clusterSpecService.cluster.spec.cloud.openstack.projectID)
      .applicationCredentialID(this._clusterSpecService.cluster.spec.cloud.openstack.applicationCredentialID)
      .applicationCredentialPassword(this._clusterSpecService.cluster.spec.cloud.openstack.applicationCredentialSecret)
      .datacenter(this._clusterSpecService.cluster.spec.cloud.dc)
      .floatingSubnets(floatingNetworkId)
      .pipe(map(subnets => _.sortBy(subnets, s => s.name.toLowerCase())))
      .pipe(catchError(() => onErrorResumeNext(EMPTY)));
  }
}
