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

import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  forwardRef,
  Input,
  OnDestroy,
  OnInit,
  Output,
} from '@angular/core';
import {
  FormGroup,
  NG_VALIDATORS,
  NG_VALUE_ACCESSOR,
} from '@angular/forms';
import {LoadBalancerClass} from '@shared/entity/cluster';
import {OpenstackNetwork, OpenstackSubnet} from '@shared/entity/provider/openstack';
import {EMPTY, Observable, onErrorResumeNext, Subject, merge} from 'rxjs';
import {takeUntil, tap, filter, catchError, map, debounceTime} from 'rxjs/operators';
import {ClusterSpecService} from '@core/services/cluster-spec';
import {PresetsService} from '@core/services/wizard/presets';
import {NodeProvider} from '@shared/model/NodeProviderConstants';
import {CredentialsType, OpenstackCredentialsTypeService} from '../../service';
import _ from 'lodash';
import {ComboboxControls} from '@app/shared/components/combobox/component';

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

@Component({
  selector: 'km-loadbalancer-class',
  templateUrl: './template.html',
  styleUrls: ['./style.scss'],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => LoadBalancerClassComponent),
      multi: true,
    },
    {
      provide: NG_VALIDATORS,
      useExisting: forwardRef(() => LoadBalancerClassComponent),
      multi: true,
    },
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: false,
})
export class LoadBalancerClassComponent implements OnInit, OnDestroy {
  @Input() form!: FormGroup; 
  @Input() index: number;
  @Input() canRemove = true;
  @Output() remove = new EventEmitter<void>();

  expanded = false;

  private onChange: (value: LoadBalancerClass) => LoadBalancerClass;
  private onTouched = () => {};

  floatingNetworks: OpenstackNetwork[] = [];
  floatingSubnets: OpenstackSubnet[] = [];
  floatingSubnetTags: string[] = [];

  networks: OpenstackNetwork[] = [];
  subnets: OpenstackSubnet[] = [];
  memberSubnets: OpenstackSubnet[] = [];

  floatingNetworksLoading = false;
  floatingSubnetsLoading = false;
  networksLoading = false;
  subnetsLoading = false;
  memberSubnetsLoading = false;

  disabled = false;
  isPresetSelected = false;

  private _domain = '';
  private _username = '';
  private _password = '';
  private _project = '';
  private _projectID = '';
  private _applicationCredentialID = '';
  private _applicationCredentialSecret = '';
  private _preset = '';

  private readonly _debounceTime = 500;
  private readonly _unsubscribe = new Subject<void>();

  constructor(
    private readonly _presets: PresetsService,
    private readonly _clusterSpecService: ClusterSpecService,
    private readonly _credentialsTypeService: OpenstackCredentialsTypeService
  ) {
    // this._initForm();
  }

  ngOnInit(): void {
    this._initNetworkSetup();

    this.form.valueChanges.pipe(takeUntil(this._unsubscribe)).subscribe(() => {
      this.emitChanges();
    });
  }

  ngOnDestroy(): void {
    this._unsubscribe.next();
    this._unsubscribe.complete();
  }

  // writeValue(value: LoadBalancerClass): void {
  //   if (value) {
  //     this._updateFormWithLoadBalancerClass(value);
  //   }
  // }

  // registerOnChange(fn: any): void {
  //   this.onChange = fn;
  // }

  // registerOnTouched(fn: any): void {
  //   this.onTouched = fn;
  //   this.form.statusChanges.pipe(takeUntil(this._unsubscribe)).subscribe(this.onTouched);
  // }

  private emitChanges(): void {
    const formValue = this._getFormValue();
    console.log('Child Value Changed', formValue);

    if (this.onChange) {
      this.onChange(formValue);
    }
    this.onTouched();
  }

  // setDisabledState?(isDisabled: boolean): void {
  //   isDisabled ? this.form.disable() : this.form.enable();
  // }

  // validate(_: AbstractControl): ValidationErrors | null {
  //   return this.form.valid ? null : {invalid: true};
  // }

  private _getFormValue(): LoadBalancerClass {
    const formValue = this.form.value;
    return {
      name: formValue.name || '',
      config: {
        floatingNetworkID: this._extractComboboxValue(formValue.config?.floatingNetworkID) || '',
        floatingSubnetID: this._extractComboboxValue(formValue.config?.floatingSubnetID) || '',
        floatingSubnet: this._extractComboboxValue(formValue.config?.floatingSubnet) || '',
        floatingSubnetTags: this._extractComboboxValue(formValue.config?.floatingSubnetTags) || '',
        networkID: this._extractComboboxValue(formValue.config?.networkID) || '',
        subnetID: this._extractComboboxValue(formValue.config?.subnetID) || '',
        memberSubnetID: this._extractComboboxValue(formValue.config?.memberSubnetID) || '',
      },
    };
  }

  // Form handling methods
  // private _updateFormWithLoadBalancerClass(value: LoadBalancerClass): void {
  //   // Convert string floatingSubnetTags to array if needed
  //   let floatingSubnetTagsArray: string[] = [];
  //   const floatingSubnetTags = value.config?.floatingSubnetTags || '';
  //   if (typeof floatingSubnetTags === 'string' && floatingSubnetTags.trim()) {
  //     floatingSubnetTagsArray = floatingSubnetTags
  //       .split(',')
  //       .map(tag => tag.trim())
  //       .filter(Boolean);
  //   } else if (Array.isArray(floatingSubnetTags)) {
  //     floatingSubnetTagsArray = floatingSubnetTags;
  //   }

  //   // Ensure all config values are strings, not null
  //   const config = {
  //     floatingNetworkID: value.config?.floatingNetworkID || '',
  //     floatingSubnetID: value.config?.floatingSubnetID || '',
  //     floatingSubnet: value.config?.floatingSubnet || '',
  //     floatingSubnetTags: floatingSubnetTagsArray,
  //     networkID: value.config?.networkID || '',
  //     subnetID: value.config?.subnetID || '',
  //     memberSubnetID: value.config?.memberSubnetID || '',
  //   };

  //   this.form.patchValue(
  //     {
  //       name: value.name || '',
  //       config,
  //     },
  //     {emitEvent: false}
  //   );

  //   // If this is the first class or has a name, expand it
  //   if (this.index === 0 || value.name) {
  //     this.expanded = true;
  //   }
  // }

  // UI event handlers
  toggleExpansion(): void {
    this.expanded = !this.expanded;
  }

  onNetworkChange(networkId: string): void {
    this.form.get('config.networkID').patchValue(networkId || '');

    if (!networkId) {
      // Clear related subnet values when network is cleared
      this.Config.patchValue({
        subnetID: '',
        memberSubnetID: '',
      });
      this.subnets = [];
      this.memberSubnets = [];
    } else {
      // Load subnets for the selected network
      this._loadSubnetsForNetwork(networkId);
    }
  }

  onFloatingNetworkChange(floatingNetworkId: string): void {
    this.form.get('config.floatingNetworkID').patchValue(floatingNetworkId || '');

    if (!floatingNetworkId) {
      // Clear related floating subnet values when floating network is cleared
      this.Config.patchValue({
        floatingSubnetID: '',
        floatingSubnet: '',
        floatingSubnetTags: [],
      });
      this.floatingSubnets = [];
      this.floatingSubnetTags = [];
    } else {
      // Load floating subnets for the selected network
      this._loadFloatingSubnetsForNetwork(floatingNetworkId);
    }
  }

  get LoadBalancerClass(): LoadBalancerClass {
    return this.form.value as LoadBalancerClass;
  }

  get Config(): FormGroup {
    return this.form.get('config') as FormGroup;
  }

  onFloatingSubnetIDChange(floatingSubnetId: string): void {
    this.Config.get('floatingSubnetID').patchValue(floatingSubnetId || '');
  }

  onFloatingSubnetChange(floatingSubnet: string): void {
    this.Config.get('floatingSubnet').patchValue(floatingSubnet || '');
  }

  onSubnetIDChange(subnetId: string): void {
    this.Config.get('subnetID').patchValue(subnetId || '');
  }

  onMemberSubnetIDChange(memberSubnetId: string): void {
    this.Config.get('memberSubnetID').patchValue(memberSubnetId || '');
  }

  onFloatingSubnetTagsChange(tags: string[]): void {
    this.Config.get('floatingSubnetTags').patchValue(tags || []);
  }

  // Display name formatters
  getNetworkDisplayName(id: string): string {
    if (!id) return '';
    const network = this.networks.find(n => n.id === id);
    return network ? `${network.name} (ID: ${network.id})` : id;
  }

  getSubnetDisplayName(id: string): string {
    if (!id) return '';
    const subnet = this.subnets.find(s => s.id === id);
    return subnet ? `${subnet.name} (${subnet.id})` : id;
  }

  getFloatingNetworkDisplayName(id: string): string {
    if (!id) return '';
    const network = this.floatingNetworks.find(n => n.id === id);
    return network ? `${network.name} (ID: ${network.id})` : id;
  }

  getFloatingSubnetDisplayName(id: string): string {
    if (!id) return '';
    const subnet = this.floatingSubnets.find(s => s.id === id);
    return subnet ? `${subnet.name} (${subnet.id})` : id;
  }

  getMemberSubnetDisplayName(id: string): string {
    if (!id) return '';
    const subnet = this.memberSubnets.find(s => s.id === id);
    return subnet ? `${subnet.name} (${subnet.id})` : id;
  }

  // State label getters
  getNetworksLabel(): string {
    if (this.networksLoading) return NetworkStateLabel.Loading;
    return this.networks.length > 0 ? NetworkStateLabel.Ready : NetworkStateLabel.Empty;
  }

  getFloatingNetworksLabel(): string {
    if (this.floatingNetworksLoading) return FloatingNetworkStateLabel.Loading;
    return this.floatingNetworks.length > 0 ? FloatingNetworkStateLabel.Ready : FloatingNetworkStateLabel.Empty;
  }

  getSubnetsLabel(): string {
    if (this.subnetsLoading) return SubnetStateLabel.Loading;
    return this.subnets.length > 0 ? SubnetStateLabel.Ready : SubnetStateLabel.Empty;
  }

  getMemberSubnetsLabel(): string {
    if (this.memberSubnetsLoading) return MemberSubnetStateLabel.Loading;
    return this.memberSubnets.length > 0 ? MemberSubnetStateLabel.Ready : MemberSubnetStateLabel.Empty;
  }

  getFloatingSubnetsLabel(): string {
    if (this.floatingSubnetsLoading) return FloatingSubnetStateLabel.Loading;
    return this.floatingSubnets.length > 0 ? FloatingSubnetStateLabel.Ready : FloatingSubnetStateLabel.Empty;
  }

  getFloatingSubnetsLabelByName(): string {
    if (this.floatingSubnetsLoading) return FloatingSubnetStateByNameLabel.Loading;
    return this.floatingSubnets.length > 0
      ? FloatingSubnetStateByNameLabel.Ready
      : FloatingSubnetStateByNameLabel.Empty;
  }

  // Helper methods to extract values from combobox
  private _extractComboboxValue(value: any): string {
    if (!value) return '';
    if (typeof value === 'string') return value;
    if (typeof value === 'object' && value[ComboboxControls.Select]) {
      return value[ComboboxControls.Select] || '';
    }
    return '';
  }

  private _initNetworkSetup(): void {
    // Setup preset handling
    this._presets.presetDetailedChanges.pipe(takeUntil(this._unsubscribe)).subscribe(preset => {
      this.isPresetSelected = !!preset;
    });

    // Setup credential change watchers
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
        this._loadNetworks();
        this._loadFloatingNetworks();
      });

    // Initial load if credentials are available
    if (this._hasRequiredCredentials() || this.isPresetSelected) {
      this._loadNetworks();
      this._loadFloatingNetworks();
    }
  }

  private _loadNetworks(): void {
    this.networksLoading = true;
    this._networkListObservable()
      .pipe(takeUntil(this._unsubscribe))
      .subscribe({
        next: networks => {
          this.networks = networks.filter(network => !network.external);
          this.networksLoading = false;
        },
        error: () => {
          this.networks = [];
          this.networksLoading = false;
        },
      });
  }

  private _loadFloatingNetworks(): void {
    this.floatingNetworksLoading = true;
    this._floatingNetworkListObservable()
      .pipe(takeUntil(this._unsubscribe))
      .subscribe({
        next: networks => {
          this.floatingNetworks = networks;
          this.floatingNetworksLoading = false;
        },
        error: () => {
          this.floatingNetworks = [];
          this.floatingNetworksLoading = false;
        },
      });
  }

  private _loadSubnetsForNetwork(networkId: string): void {
    this.subnetsLoading = true;
    this.memberSubnetsLoading = true;

    merge(
      this._subnetIDListObservable(networkId).pipe(map(subnets => ({type: 'subnets', subnets}))),
      this._memberSubnetListObservable(networkId).pipe(map(subnets => ({type: 'memberSubnets', subnets})))
    )
      .pipe(takeUntil(this._unsubscribe))
      .subscribe({
        next: result => {
          if (result.type === 'subnets') {
            this.subnets = result.subnets;
            this.subnetsLoading = false;
          } else if (result.type === 'memberSubnets') {
            this.memberSubnets = result.subnets;
            this.memberSubnetsLoading = false;
          }
        },
        error: () => {
          this.subnets = [];
          this.memberSubnets = [];
          this.subnetsLoading = false;
          this.memberSubnetsLoading = false;
        },
      });
  }

  private _loadFloatingSubnetsForNetwork(floatingNetworkId: string): void {
    this.floatingSubnetsLoading = true;

    this._floatingSubnetListObservable(floatingNetworkId)
      .pipe(takeUntil(this._unsubscribe))
      .subscribe({
        next: subnets => {
          this.floatingSubnets = subnets;
          this.floatingSubnetsLoading = false;
          // Extract unique tags from all subnets
          const allTags = subnets.flatMap(subnet => subnet.tags || []);
          this.floatingSubnetTags = [...new Set(allTags)];
        },
        error: () => {
          this.floatingSubnets = [];
          this.floatingSubnetTags = [];
          this.floatingSubnetsLoading = false;
        },
      });
  }

  private _clearAllData(): void {
    this.networks = [];
    this.floatingNetworks = [];
    this.subnets = [];
    this.memberSubnets = [];
    this.floatingSubnets = [];
    this.floatingSubnetTags = [];
    this.networksLoading = false;
    this.floatingNetworksLoading = false;
    this.subnetsLoading = false;
    this.memberSubnetsLoading = false;
    this.floatingSubnetsLoading = false;
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
    this._clearAllData();
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
