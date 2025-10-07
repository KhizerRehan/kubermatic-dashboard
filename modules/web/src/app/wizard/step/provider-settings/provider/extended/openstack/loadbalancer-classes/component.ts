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
import {
  FormArray,
  FormBuilder,
  FormControl,
  NG_VALIDATORS,
  NG_VALUE_ACCESSOR,
} from '@angular/forms';
import {LoadBalancerClass} from '@shared/entity/cluster';
import {BaseFormValidator} from '@shared/validators/base-form.validator';
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
export class LoadBalancerClassesComponent extends BaseFormValidator implements OnInit, OnDestroy {
  loadBalancerClasses: LoadBalancerClass[] = [];
  protected _unsubscribe = new Subject<void>();

  constructor(
    private readonly _builder: FormBuilder
  ) {
    super('LoadBalancer Classes');
  }

  get loadBalancerClassesArray(): FormArray {
    return this.form.get('loadBalancerClasses') as FormArray;
  }

  ngOnInit(): void {
    this.initForm();
    
    // Add initial LoadBalancer class if none exist
    if (this.loadBalancerClasses.length === 0) {
      this.addLoadBalancerClass();
    }
  }

  ngOnDestroy(): void {
    this._unsubscribe.next();
    this._unsubscribe.complete();
  }

  addLoadBalancerClass(): void {
    const index = this.loadBalancerClasses.length;
    const defaultLoadBalancerClass: LoadBalancerClass = {
      name: `Default-LoadBalancer-Class-${index + 1}`,
      config: {
        floatingNetworkID: '',
        floatingSubnetID: '',
        floatingSubnet: '',
        floatingSubnetTags: '',
        networkID: '',
        subnetID: '',
        memberSubnetID: '',
      },
    };
    
    this.loadBalancerClasses.push(defaultLoadBalancerClass);
    
    // Add a FormControl to the FormArray for validation
    const classControl = new FormControl(defaultLoadBalancerClass);
    this.loadBalancerClassesArray.push(classControl);
  }

  removeLoadBalancerClass(index: number): void {
    this.loadBalancerClasses.splice(index, 1);
    this.loadBalancerClassesArray.removeAt(index);
  }

  onLoadBalancerClassChange(index: number, updatedClass: LoadBalancerClass): void {
    this.loadBalancerClasses[index] = updatedClass;
    
    // Update the corresponding FormControl
    const control = this.loadBalancerClassesArray.at(index);
    if (control) {
      control.setValue(updatedClass);
    }
    
    // Emit changes to parent
    this.emitChanges();
  }

  canRemove(): boolean {
    return this.loadBalancerClasses.length > 1;
  }

  canAddLoadBalancerClass(): boolean {
    return true;
  }

  // Override BaseFormValidator's writeValue to handle LoadBalancerClass[] input
  writeValue(value: LoadBalancerClass[]): void {
    if (value && Array.isArray(value)) {
      this.loadBalancerClasses = [...value];
      this.syncFormArrayWithData();
    } else {
      this.loadBalancerClasses = [];
      if (this.loadBalancerClasses.length === 0) {
        this.addLoadBalancerClass();
      }
    }
  }

  // Override BaseFormValidator's registerOnChange to emit LoadBalancerClass[]
  registerOnChange(fn: any): void {
    this.onValueChange = fn;
    // We'll call fn(this.loadBalancerClasses) whenever data changes
  }

  private syncFormArrayWithData(): void {
    this.loadBalancerClassesArray.clear();
    this.loadBalancerClasses.forEach(lbClass => {
      const control = new FormControl(lbClass);
      this.loadBalancerClassesArray.push(control);
    });
  }

  private emitChanges(): void {
    if (this.onValueChange) {
      this.onValueChange(this.loadBalancerClasses);
    }
  }

  private initForm(): void {
    this.form = this._builder.group({
      loadBalancerClasses: this._builder.array([]),
    });
  }
}