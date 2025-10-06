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

import {AfterViewInit, Component, forwardRef, OnDestroy, OnInit} from '@angular/core';
import {
  ControlValueAccessor,
  FormArray,
  FormBuilder,
  FormGroup,
  NG_VALIDATORS,
  NG_VALUE_ACCESSOR,
  Validators,
} from '@angular/forms';
import {ClusterSpecService} from '@core/services/cluster-spec';
import {PresetsService} from '@core/services/wizard/presets';
import {LoadBalancerClass} from '@shared/entity/cluster';
import {OpenstackNetwork, OpenstackSubnet} from '@shared/entity/provider/openstack';
import {NodeProvider} from '@shared/model/NodeProviderConstants';
import {BaseFormValidator} from '@shared/validators/base-form.validator';
import _ from 'lodash';
import {EMPTY, merge, Observable, onErrorResumeNext, Subject} from 'rxjs';
import {catchError, debounceTime, distinctUntilChanged, filter, map, switchMap, takeUntil, tap} from 'rxjs/operators';
import {CredentialsType, OpenstackCredentialsTypeService} from '../service';

// State enums for LoadBalancer classes
enum FloatingNetworkState {
  Ready = 'Floating Network ID',
  Loading = 'Loading...',
  Empty = 'No Floating Networks Available',
}

enum FloatingSubnetState {
  Ready = 'Floating Subnet ID',
  Loading = 'Loading...',
  Empty = 'No Floating Subnets Available',
}

enum NetworkState {
  Ready = 'Network ID',
  Loading = 'Loading...',
  Empty = 'No Networks Available',
}

enum SubnetState {
  Ready = 'Subnet ID',
  Loading = 'Loading...',
  Empty = 'No Subnets Available',
}

enum MemberSubnetState {
  Ready = 'Member Subnet ID',
  Loading = 'Loading...',
  Empty = 'No Member Subnets Available',
}

interface LoadBalancerClassState {
  floatingNetworks: OpenstackNetwork[];
  floatingSubnets: OpenstackSubnet[];
  floatingSubnetTags: string[];
  networks: OpenstackNetwork[];
  subnets: OpenstackSubnet[];
  memberSubnets: OpenstackSubnet[];
  networksLabel: NetworkState;
  subnetsLabel: SubnetState;
  memberSubnetsLabel: MemberSubnetState;
  floatingNetworksLabel: FloatingNetworkState;
  floatingSubnetsLabel: FloatingSubnetState;
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
export class LoadBalancerClassesComponent extends BaseFormValidator implements OnInit, AfterViewInit, ControlValueAccessor, OnDestroy {
  private readonly _debounceTime = 500;
  private readonly _networkChangeSubjects: Map<number, Subject<string>> = new Map();
  private readonly _floatingNetworkChangeSubjects: Map<number, Subject<string>> = new Map();

  isPresetSelected = false;
  loadBalancerClassStates: Map<number, LoadBalancerClassState> = new Map();

  // Tree node state management
  private _expandedClasses: Set<number> = new Set();

  private _domain = '';
  private _username = '';
  private _password = '';
  private _project = '';
  private _projectID = '';
  private _applicationCredentialID = '';
  private _applicationCredentialSecret = '';
  private _preset = '';

  protected _unsubscribe = new Subject<void>();
  private _onChange = (_: LoadBalancerClass[]) => {};
  private _onTouched = () => {};

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

    // Setup preset handling
    this._presets.presetDetailedChanges.pipe(takeUntil(this._unsubscribe)).subscribe(preset => {
      this.isPresetSelected = !!preset;
      const providerSettings = preset?.providers.find(provider => provider.name === NodeProvider.OPENSTACK);

      if (providerSettings?.isCustomizable) {
        // Handle preset load balancer classes if available
        const presetLoadBalancerClasses = providerSettings.openstack?.loadBalancerClasses || [];
        this.setLoadBalancerClasses(presetLoadBalancerClasses);
      }
    });

    // Single subscription handling all credential changes and network loading (like default component)
    merge(
      this._clusterSpecService.clusterChanges,
      this._credentialsTypeService.credentialsTypeChanges,
      this._presets.presetChanges
    )
      .pipe(filter(_ => this._clusterSpecService.provider === NodeProvider.OPENSTACK))
      .pipe(debounceTime(this._debounceTime))
      .pipe(
        tap(_ => {
          // Clear credentials when preset is removed
          if (!this._presets.preset && this._preset) {
            this._clearCredentials();
          }
          // Clear data when credentials are invalid and no preset
          if (!this._hasRequiredCredentials() && !this.isPresetSelected) {
            this._clearAllData();
          }
        })
      )
      .pipe(filter(_ => this._hasRequiredCredentials() || this.isPresetSelected))
      .pipe(filter(_ => this._areCredentialsChanged()))
      .pipe(takeUntil(this._unsubscribe))
      .subscribe(() => {
        this._loadNetworksForAllClasses();
        this._loadFloatingNetworksForAllClasses();
      });
  }

  ngAfterViewInit(): void {
    // Set default class name for the initial class (index 0)
    if (this.loadBalancerClassesArray.length > 0) {
      this.setDefaultClassName(0);
    }
  }

  ngOnDestroy(): void {
    this._unsubscribe.next();
    this._unsubscribe.complete();
    this._networkChangeSubjects.forEach(subject => subject.complete());
    this._floatingNetworkChangeSubjects.forEach(subject => subject.complete());
  }

  writeValue(obj: LoadBalancerClass[]): void {
    if (obj) {
      this.setLoadBalancerClasses(obj);
    }
  }

  registerOnChange(fn: (value: LoadBalancerClass[]) => void): void {
    this._onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this._onTouched = fn;
  }

  onTouched(): void {
    this._onTouched();
  }

  getNetworkDisplayName(index: number, id: string): string {
    if (!id) return '';
    const state = this.loadBalancerClassStates.get(index);
    const network = state?.networks.find(n => n.id === id);
    return network ? `${network.name} (ID: ${network.id})` : id;
  }

  getSubnetDisplayName(index: number, id: string): string {
    if (!id) return '';
    const state = this.loadBalancerClassStates.get(index);
    const subnet = state?.subnets.find(s => s.id === id);
    return subnet ? `${subnet.name} (${subnet.id})` : id;
  }

  getFloatingNetworkDisplayName(index: number, id: string): string {
    if (!id) return '';
    const state = this.loadBalancerClassStates.get(index);
    const network = state?.floatingNetworks.find(n => n.id === id);
    return network ? `${network.name} (ID: ${network.id})` : id;
  }

  getFloatingSubnetDisplayName(index: number, id: string): string {
    if (!id) return '';
    const state = this.loadBalancerClassStates.get(index);
    const subnet = state?.floatingSubnets.find(s => s.id === id);
    return subnet ? `${subnet.name} (${subnet.id})` : id;
  }

  getMemberSubnetDisplayName(index: number, id: string): string {
    if (!id) return '';
    const state = this.loadBalancerClassStates.get(index);
    const subnet = state?.memberSubnets.find(s => s.id === id);
    return subnet ? `${subnet.name} (${subnet.id})` : id;
  }

  getNetworksForClass(index: number): OpenstackNetwork[] {
    return this.loadBalancerClassStates.get(index)?.networks || [];
  }

  getSubnetsForClass(index: number): OpenstackSubnet[] {
    return this.loadBalancerClassStates.get(index)?.subnets || [];
  }

  getMemberSubnetsForClass(index: number): OpenstackSubnet[] {
    return this.loadBalancerClassStates.get(index)?.memberSubnets || [];
  }

  getFloatingNetworksForClass(index: number): OpenstackNetwork[] {
    const networks = this.loadBalancerClassStates.get(index)?.floatingNetworks || [];
    console.log(`getFloatingNetworksForClass(${index}):`, networks);
    return networks;
  }

  getFloatingSubnetsForClass(index: number): OpenstackSubnet[] {
    return this.loadBalancerClassStates.get(index)?.floatingSubnets || [];
  }

  getFloatingSubnetTagsForClass(index: number): string[] {
    return this.loadBalancerClassStates.get(index)?.floatingSubnetTags || [];
  }

  // State label getters
  getNetworksLabel(index: number): NetworkState {
    return this.loadBalancerClassStates.get(index)?.networksLabel || NetworkState.Empty;
  }

  getFloatingNetworksLabel(index: number): FloatingNetworkState {
    return this.loadBalancerClassStates.get(index)?.floatingNetworksLabel || FloatingNetworkState.Empty;
  }

  getSubnetsLabel(index: number): SubnetState {
    return this.loadBalancerClassStates.get(index)?.subnetsLabel || SubnetState.Empty;
  }

  getMemberSubnetsLabel(index: number): MemberSubnetState {
    return this.loadBalancerClassStates.get(index)?.memberSubnetsLabel || MemberSubnetState.Empty;
  }

  getFloatingSubnetsLabel(index: number): FloatingSubnetState {
    return this.loadBalancerClassStates.get(index)?.floatingSubnetsLabel || FloatingSubnetState.Empty;
  }

  addLoadBalancerClass(): void {
    const index = this.loadBalancerClassesArray.length;
    const classForm = this.createLoadBalancerClassFormGroup();

    this.loadBalancerClassesArray.push(classForm);

    // Initialize with existing data from other classes (if any)
    const existingState = this.loadBalancerClassStates.get(0);
    this.loadBalancerClassStates.set(index, {
      networks: existingState?.networks || [],
      subnets: existingState?.subnets || [],
      memberSubnets: existingState?.memberSubnets || [],
      floatingNetworks: existingState?.floatingNetworks || [],
      floatingSubnets: existingState?.floatingSubnets || [],
      floatingSubnetTags: existingState?.floatingSubnetTags || [],
      // Initialize state labels
      networksLabel: existingState?.networksLabel || NetworkState.Empty,
      subnetsLabel: SubnetState.Empty,
      memberSubnetsLabel: MemberSubnetState.Empty,
      floatingNetworksLabel: existingState?.floatingNetworksLabel || FloatingNetworkState.Empty,
      floatingSubnetsLabel: FloatingSubnetState.Empty,
    });

    // Create network change subjects for this class
    this._networkChangeSubjects.set(index, new Subject<string>());
    this._floatingNetworkChangeSubjects.set(index, new Subject<string>());

    // Setup network change listeners
    this._setupNetworkChangeListener(index);
    this._setupFloatingNetworkChangeListener(index);

    // Expand the new class by default
    this._expandedClasses.add(index);

    // Load networks for the new class if credentials are available
    if (this._hasRequiredCredentials() || this.isPresetSelected) {
      this._loadNetworksForAllClasses();
      this._loadFloatingNetworksForAllClasses();
    }

    // Set default class name for the newly added class
    this.setDefaultClassName(index);

    // Notify parent form of changes
    this._onChange(this._getCurrentLoadBalancerClasses());
  }

  removeLoadBalancerClass(index: number): void {
    this.loadBalancerClassesArray.removeAt(index);
    this.loadBalancerClassStates.delete(index);

    // Clean up subjects
    this._networkChangeSubjects.get(index)?.complete();
    this._networkChangeSubjects.delete(index);
    this._floatingNetworkChangeSubjects.get(index)?.complete();
    this._floatingNetworkChangeSubjects.delete(index);

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

    // Remove from cluster spec
    if (this._clusterSpecService.cluster.spec.cloud.openstack.loadBalancerClasses) {
      this._clusterSpecService.cluster.spec.cloud.openstack.loadBalancerClasses.splice(index, 1);
      this._clusterSpecService.cluster = {...this._clusterSpecService.cluster};
    }

    // Notify parent form of changes
    this._onChange(this._getCurrentLoadBalancerClasses());
  }

  canRemove(): boolean {
    return this.loadBalancerClassesArray.length > 1;
  }

  private setDefaultClassName(index: number): void {
    if (index < 0 || index >= this.loadBalancerClassesArray.length) {
      return;
    }

    const defaultClassName = `default-class-${index + 1}`;
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

    // Clear tree state when setting new classes
    this._expandedClasses.clear();

    if (loadBalancerClasses.length === 0) {
      this.addLoadBalancerClass();
      return;
    }

    loadBalancerClasses.forEach((lbClass, index) => {
      const formGroup = this.createLoadBalancerClassFormGroup();
      const patchValue = {
        ...lbClass,
        config: {
          ...lbClass.config,
          floatingSubnetTags: Array.isArray(lbClass.config?.floatingSubnetTags)
            ? lbClass.config.floatingSubnetTags
            : lbClass.config?.floatingSubnetTags?.split(',').filter(tag => tag.trim()) || [],
        },
      };
      formGroup.patchValue(patchValue);
      this.loadBalancerClassesArray.push(formGroup);

      // Expand the first class by default when loading existing classes
      if (index === 0) {
        this._expandedClasses.add(index);
      }
    });
  }

  onNetworkChange(index: number, networkId: string): void {
    // Update cluster spec directly
    this._updateLoadBalancerClassInCluster(index, {networkID: networkId});

    const state = this.loadBalancerClassStates.get(index);
    if (state) {
      if (!networkId) {
        // Clear subnets and member subnets when network is cleared
        state.subnets = [];
        state.memberSubnets = [];

        // Clear related config values from cluster spec
        this._updateLoadBalancerClassInCluster(index, {
          subnetID: '',
          memberSubnetID: '',
        });
      }
    }

    this._networkChangeSubjects.get(index)?.next(networkId);
  }

  onFloatingNetworkChange(index: number, floatingNetworkId: string): void {
    this._updateLoadBalancerClassInCluster(index, {floatingNetworkID: floatingNetworkId});

    const state = this.loadBalancerClassStates.get(index);
    if (state && !floatingNetworkId) {
      // Clear floating subnets and floating subnet tags when floating network is cleared
      state.floatingSubnets = [];
      state.floatingSubnetTags = [];

      // Clear related config values from cluster spec
      this._updateLoadBalancerClassInCluster(index, {
        floatingSubnetID: '',
        floatingSubnet: '',
        floatingSubnetTags: '',
      });
    }

    this._floatingNetworkChangeSubjects.get(index)?.next(floatingNetworkId);
  }

  onFloatingSubnetIDChange(index: number, floatingSubnetId: string): void {
    this._updateLoadBalancerClassInCluster(index, {floatingSubnetID: floatingSubnetId});
  }

  onFloatingSubnetChange(index: number, floatingSubnet: string): void {
    this._updateLoadBalancerClassInCluster(index, {floatingSubnet: floatingSubnet});
  }

  onSubnetIDChange(index: number, subnetId: string): void {
    this._updateLoadBalancerClassInCluster(index, {subnetID: subnetId});
  }

  onMemberSubnetIDChange(index: number, memberSubnetId: string): void {
    this._updateLoadBalancerClassInCluster(index, {memberSubnetID: memberSubnetId});
  }

  onNameChange(index: number, name: string): void {
    this._updateLoadBalancerClassInCluster(index, {name: name});
  }

  onFloatingSubnetTagsChange(index: number, tags: string[]): void {
    this._updateLoadBalancerClassInCluster(index, {floatingSubnetTags: tags.join(',')});
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

  // Check if we can add a new LoadBalancer class
  canAddLoadBalancerClass(): boolean {
    // Check if the last LoadBalancer class has a name
    if (this.loadBalancerClassesArray.length === 0) {
      return true;
    }

    const lastIndex = this.loadBalancerClassesArray.length - 1;
    const lastFormGroup = this.loadBalancerClassesArray.at(lastIndex);
    const name = lastFormGroup?.get('name')?.value;

    return !!name && name.trim().length > 0;
  }

  private _updateLoadBalancerClassInCluster(
    index: number,
    updates: Partial<LoadBalancerClass> & {[key: string]: any}
  ): void {
    const cluster = this._clusterSpecService.cluster;
    const openstack = cluster.spec.cloud.openstack;

    openstack.loadBalancerClasses = openstack.loadBalancerClasses || [];
    const loadBalancerClasses = openstack.loadBalancerClasses;

    // Ensure the array has enough elements
    if (!loadBalancerClasses[index]) {
      loadBalancerClasses[index] = {name: '', config: {}};
    }

    // Update name and config in a simple, maintainable way
    Object.entries(updates).forEach(([key, value]) => {
      if (key === 'name') {
        loadBalancerClasses[index].name = value;
      } else {
        if (!loadBalancerClasses[index].config) {
          loadBalancerClasses[index].config = {};
        }
        loadBalancerClasses[index].config[key] = value;
      }
    });

    // Trigger change detection and notify parent
    this._clusterSpecService.cluster = {...cluster};
    this._onChange(this._getCurrentLoadBalancerClasses());
  }

  private _getCurrentLoadBalancerClasses(): LoadBalancerClass[] {
    const loadBalancerClasses = this._clusterSpecService.cluster.spec.cloud.openstack.loadBalancerClasses || [];
    return loadBalancerClasses
      .filter(lbClass => lbClass.name && lbClass.name.trim())
      .map(lbClass => ({
        name: lbClass.name,
        config: {...lbClass.config},
      }));
  }

  private _clearAllData(): void {
    this.loadBalancerClassStates.forEach(state => {
      state.networks = [];
      state.subnets = [];
      state.memberSubnets = [];
      state.floatingNetworks = [];
      state.floatingSubnets = [];
      state.floatingSubnetTags = [];
      state.networksLabel = NetworkState.Empty;
      state.subnetsLabel = SubnetState.Empty;
      state.memberSubnetsLabel = MemberSubnetState.Empty;
      state.floatingNetworksLabel = FloatingNetworkState.Empty;
      state.floatingSubnetsLabel = FloatingSubnetState.Empty;
    });
  }

  private _setupNetworkChangeListener(index: number): void {
    const networkChangeSubject = this._networkChangeSubjects.get(index);
    if (!networkChangeSubject) return;

    networkChangeSubject
      .pipe(debounceTime(this._debounceTime))
      .pipe(distinctUntilChanged())
      .pipe(filter(networkId => !!networkId))
      .pipe(
        switchMap(networkId => {
          // Set loading states
          const state = this.loadBalancerClassStates.get(index);
          if (state) {
            state.subnetsLabel = SubnetState.Loading;
            state.memberSubnetsLabel = MemberSubnetState.Loading;
          }

          // Load both regular subnets and member subnets in parallel
          return merge(
            this._subnetIDListObservable(networkId).pipe(map(subnets => ({type: 'subnets', subnets}))),
            this._memberSubnetListObservable(networkId).pipe(map(subnets => ({type: 'memberSubnets', subnets})))
          );
        })
      )
      .pipe(takeUntil(this._unsubscribe))
      .subscribe({
        next: result => {
          if (result.type === 'subnets') {
            this._loadSubnetsForClass(index, result.subnets);
          } else if (result.type === 'memberSubnets') {
            this._loadMemberSubnetsForClass(index, result.subnets);
          }
        },
        error: () => {
          const state = this.loadBalancerClassStates.get(index);
          if (state) {
            state.subnetsLabel = SubnetState.Empty;
            state.memberSubnetsLabel = MemberSubnetState.Empty;
          }
        },
      });
  }

  private _setupFloatingNetworkChangeListener(index: number): void {
    const floatingNetworkChangeSubject = this._floatingNetworkChangeSubjects.get(index);
    if (!floatingNetworkChangeSubject) return;

    floatingNetworkChangeSubject
      .pipe(debounceTime(this._debounceTime))
      .pipe(distinctUntilChanged())
      .pipe(filter(floatingNetworkId => !!floatingNetworkId))
      .pipe(
        switchMap(floatingNetworkId => {
          // Set loading state
          const state = this.loadBalancerClassStates.get(index);
          if (state) {
            state.floatingSubnetsLabel = FloatingSubnetState.Loading;
          }
          return this._floatingSubnetListObservable(floatingNetworkId);
        })
      )
      .pipe(takeUntil(this._unsubscribe))
      .subscribe({
        next: subnets => this._loadFloatingSubnetsForClass(index, subnets),
        error: () => {
          const state = this.loadBalancerClassStates.get(index);
          if (state) {
            state.floatingSubnetsLabel = FloatingSubnetState.Empty;
          }
        },
      });
  }

  private _loadNetworksForAllClasses(): void {
    // Set loading state for all classes
    this.loadBalancerClassStates.forEach(state => {
      state.networksLabel = NetworkState.Loading;
    });

    this._networkListObservable().subscribe({
      next: networks => {
        const filteredNetworks = networks.filter(network => !network.external);
        this.loadBalancerClassStates.forEach(state => {
          state.networks = filteredNetworks;
          state.networksLabel = !_.isEmpty(filteredNetworks) ? NetworkState.Ready : NetworkState.Empty;
        });
      },
      error: () => {
        this.loadBalancerClassStates.forEach(state => {
          state.networksLabel = NetworkState.Empty;
        });
      },
    });
  }

  private _loadFloatingNetworksForAllClasses(): void {
    // Set loading state for all classes
    this.loadBalancerClassStates.forEach(state => {
      state.floatingNetworksLabel = FloatingNetworkState.Loading;
    });

    this._floatingNetworkListObservable().subscribe({
      next: networks => {
        console.log('Floating networks loaded:', networks);
        this.loadBalancerClassStates.forEach(state => {
          state.floatingNetworks = networks;
          state.floatingNetworksLabel = !_.isEmpty(networks) ? FloatingNetworkState.Ready : FloatingNetworkState.Empty;
        });
      },
      error: error => {
        console.error('Error loading floating networks:', error);
        this.loadBalancerClassStates.forEach(state => {
          state.floatingNetworksLabel = FloatingNetworkState.Empty;
        });
      },
    });
  }

  private _loadSubnetsForClass(index: number, subnets: OpenstackSubnet[]): void {
    const state = this.loadBalancerClassStates.get(index);
    if (state) {
      state.subnets = subnets;
      state.subnetsLabel = !_.isEmpty(subnets) ? SubnetState.Ready : SubnetState.Empty;
    }
  }

  private _loadMemberSubnetsForClass(index: number, subnets: OpenstackSubnet[]): void {
    const state = this.loadBalancerClassStates.get(index);
    if (state) {
      state.memberSubnets = subnets;
      state.memberSubnetsLabel = !_.isEmpty(subnets) ? MemberSubnetState.Ready : MemberSubnetState.Empty;
    }
  }

  private _loadFloatingSubnetsForClass(index: number, subnets: OpenstackSubnet[]): void {
    const state = this.loadBalancerClassStates.get(index);
    if (state) {
      state.floatingSubnets = subnets;
      state.floatingSubnetsLabel = !_.isEmpty(subnets) ? FloatingSubnetState.Ready : FloatingSubnetState.Empty;
      // Extract unique tags from all subnets
      const allTags = subnets.flatMap(subnet => subnet.tags || []);
      state.floatingSubnetTags = [...new Set(allTags)];
    }
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
    console.log('Clearing credentials and all load balancer classes...');
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
    console.log('Clearing all load balancer classes from form and cluster spec...');

    // Clear the cluster spec
    if (this._clusterSpecService.cluster.spec.cloud.openstack.loadBalancerClasses) {
      this._clusterSpecService.cluster.spec.cloud.openstack.loadBalancerClasses = [];
      this._clusterSpecService.cluster = {...this._clusterSpecService.cluster};
    }

    // Clear the form array
    while (this.loadBalancerClassesArray.length !== 0) {
      this.loadBalancerClassesArray.removeAt(0);
    }

    // Clear all states
    this.loadBalancerClassStates.clear();
    this._networkChangeSubjects.clear();
    this._floatingNetworkChangeSubjects.clear();

    // Clear tree state
    this._expandedClasses.clear();

    // Notify parent form of changes
    this._onChange([]);

    // Reset to initial state - no load balancer classes
    console.log('All load balancer classes cleared successfully');
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
      .networks() // Use networks() API instead of floatingNetworks() - same as basic component
      .pipe(
        map(networks => {
          // Filter for external networks (floating networks) - same logic as basic component
          const floatingNetworks = networks.filter(network => network.external === true);
          console.log('Floating networks (external networks):', floatingNetworks);

          // TODO: Remove this after testing
          // Add hardcoded network value to the list for testing
          const networksWithTestData = [
            ...floatingNetworks,
            {
              id: '45d48cb4-73a7-4504-b06b-3f9c53576a05',
              name: 'ext-net-1 (Khizer)',
              external: true,
            },
          ];
          console.log('Floating networks after hardcoded addition:', networksWithTestData);
          return _.sortBy(networksWithTestData, n => n.name.toLowerCase());
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
