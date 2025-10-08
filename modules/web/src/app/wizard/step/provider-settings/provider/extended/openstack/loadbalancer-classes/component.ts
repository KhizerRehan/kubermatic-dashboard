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

import {Component, forwardRef, OnDestroy, OnInit} from '@angular/core';
import {FormArray, FormBuilder, FormGroup, NG_VALIDATORS, NG_VALUE_ACCESSOR} from '@angular/forms';
import {ClusterSpecService} from '@app/core/services/cluster-spec';
import {ClusterSpec, CloudSpec, Cluster, LoadBalancerClass, OpenstackCloudSpec} from '@shared/entity/cluster';
import {Subject} from 'rxjs';

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
export class LoadBalancerClassesComponent implements OnInit, OnDestroy {
  form: FormGroup;
  protected _unsubscribe = new Subject<void>();

  constructor(
    private readonly _builder: FormBuilder,
    private readonly _clusterSpecService: ClusterSpecService
  ) {}

  get loadBalancerClassesArray(): FormArray<FormGroup> {
    return this.form.get('loadBalancerClasses') as FormArray<FormGroup>;
  }

  get loadBalancerClasses(): LoadBalancerClass[] {
    return this.loadBalancerClassesArray.value || [];
  }

  ngOnInit(): void {
    this.initForm();
  }

  ngOnDestroy(): void {
    this._unsubscribe.next();
    this._unsubscribe.complete();
  }

  initForm(): void {
    this.form = this._builder.group({
      loadBalancerClasses: this._builder.array([]),
    });
  }

  addLoadBalancerClass(): void {
    const newGroup = this._builder.group({
      name: [''],
      config: this._builder.group({}),
    });
    this.loadBalancerClassesArray.push(newGroup);
  }

  removeLoadBalancerClass(index: number): void {
    this.loadBalancerClassesArray.removeAt(index);
  }

  canRemove(): boolean {
    return this.loadBalancerClassesArray.length > 0;
  }

  canAddLoadBalancerClass(): boolean {
    return true;
  }

  onConfigValueChange(index: number, event: {key: string; value: any}): void {
    if (index < 0 || index >= this.loadBalancerClassesArray.length) {
      return;
    }

    // Get the current class control
    const loadBalancerClassControl = this.loadBalancerClassesArray.at(index);

    // Handle all other properties normally
    loadBalancerClassControl.patchValue({
      ...loadBalancerClassControl.value,
      config: {
        ...loadBalancerClassControl.value.config,
        [event.key]: event.value,
      },
    });

    // Update the cluster entity with the latest loadBalancerClasses
    this._clusterSpecService.cluster = this._getClusterEntity();
  }

  private _getClusterEntity(): Cluster {
    return {
      spec: {
        cloud: {
          openstack: {
            loadBalancerClasses: this.loadBalancerClasses,
          } as OpenstackCloudSpec,
        } as CloudSpec,
      } as ClusterSpec,
    } as Cluster;
  }
}
