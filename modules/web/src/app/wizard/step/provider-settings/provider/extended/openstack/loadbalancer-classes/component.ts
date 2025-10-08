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
  AbstractControl,
  ControlValueAccessor,
  FormArray,
  FormBuilder,
  FormGroup,
  NG_VALIDATORS,
  NG_VALUE_ACCESSOR,
  ValidationErrors,
  Validator,
} from '@angular/forms';
import { ComboboxControls } from '@app/shared/components/combobox/component';
import {LoadBalancerClass} from '@shared/entity/cluster';
import {Subject} from 'rxjs';
import {takeUntil} from 'rxjs/operators';

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
export class LoadBalancerClassesComponent implements OnInit, OnDestroy, ControlValueAccessor, Validator {
  form: FormGroup;
  protected _unsubscribe = new Subject<void>();
  private onChange: (value: LoadBalancerClass[]) => LoadBalancerClass[];
  private onTouched = () => {};

  constructor(
    private readonly _builder: FormBuilder,
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
      loadBalancerClasses: this._builder.array<FormGroup>([]),
    });

    this.form.valueChanges.pipe(takeUntil(this._unsubscribe)).subscribe(() => {
      this.emitChanges();
    });
  }

  addLoadBalancerClass(): void {
    const lbClassForm = this._builder.group({
      name: '',
      config: this._builder.group({
        floatingNetworkID: '',
        floatingSubnetID: '',
        floatingSubnet: '',
        floatingSubnetTags: [],
        networkID: '',
        subnetID: '',
        memberSubnetID: '',
      }),
    });

    // Add the group to the FormArray
    this.loadBalancerClassesArray.push(lbClassForm);
  }

  removeLoadBalancerClass(index: number): void {
    this.loadBalancerClassesArray.removeAt(index);
  }

  validate(_: AbstractControl): ValidationErrors | null {
    return this.form.valid ? null : {invalid: true};
  }

  writeValue(value: any): void {
    if (value) {
      this.setLoadBalancerClasses(value);
    }
  }

  registerOnChange(fn: any): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: any): void {
    this.onTouched = fn;
  }

  setDisabledState?(isDisabled: boolean): void {
    isDisabled ? this.form.disable() : this.form.enable();
  }

  onLoadBalancerClassChange(index: number, updatedClass: LoadBalancerClass): void {
    const control = this.loadBalancerClassesArray.at(index);
    if (control) {
      control.setValue(updatedClass, {emitEvent: false});
    }

    this.emitChanges();
  }

  canRemove(): boolean {
    return this.loadBalancerClassesArray.length > 0;
  }

  canAddLoadBalancerClass(): boolean {
    return true;
  }

  private setLoadBalancerClasses(loadBalancerClasses: LoadBalancerClass[]): void {
    this.loadBalancerClassesArray.clear();

    if (!loadBalancerClasses || loadBalancerClasses.length === 0) {
      return;
    }

    loadBalancerClasses.forEach(lbClass => {
      const lbClassForm = this._builder.group({
        name: lbClass.name || '',
        config: this._builder.group({
          floatingNetworkID: lbClass.config?.floatingNetworkID || '',
          floatingSubnetID: lbClass.config?.floatingSubnetID || '',
          floatingSubnet: lbClass.config?.floatingSubnet || '',
          floatingSubnetTags: this.parseFloatingSubnetTags(lbClass.config?.floatingSubnetTags),
          networkID: lbClass.config?.networkID || '',
          subnetID: lbClass.config?.subnetID || '',
          memberSubnetID: lbClass.config?.memberSubnetID || '',
        }),
      });
      this.loadBalancerClassesArray.push(lbClassForm);
    });
  }

  private parseFloatingSubnetTags(tags: string | string[]): string[] {
    if (Array.isArray(tags)) {
      return tags;
    }
    if (typeof tags === 'string' && tags.trim()) {
      return tags
        .split(',')
        .map(tag => tag.trim())
        .filter(Boolean);
    }
    return [];
  }

  private emitChanges(): void {
    if (this.onChange) {
      const mappeedLoadBalancerClasses = this.loadBalancerClasses.map(lbClass => {
        return this._getFormValue(lbClass);
      });

      console.log('Parent Value Changed', mappeedLoadBalancerClasses);

      this.onChange(mappeedLoadBalancerClasses);
    }
    this.onTouched();
  }


  private _getFormValue(lbClass: LoadBalancerClass): LoadBalancerClass {    
    return {
      name: lbClass.name || '',
      config: {
        floatingNetworkID: this._extractComboboxValue(lbClass.config?.floatingNetworkID) || '',
        floatingSubnetID: this._extractComboboxValue(lbClass.config?.floatingSubnetID) || '',
        floatingSubnet: this._extractComboboxValue(lbClass.config?.floatingSubnet) || '',
        floatingSubnetTags: this._extractComboboxValue(lbClass.config?.floatingSubnetTags) || '',
        networkID: this._extractComboboxValue(lbClass.config?.networkID) || '',
        subnetID: this._extractComboboxValue(lbClass.config?.subnetID) || '',
        memberSubnetID: this._extractComboboxValue(lbClass.config?.memberSubnetID) || '',
      },
    };
  }

  private _extractComboboxValue(value: any): string {
    if (!value) return '';
    if (typeof value === 'string') return value;
    if (typeof value === 'object' && value[ComboboxControls.Select]) {
      return value[ComboboxControls.Select] || '';
    }
    return '';
  }
  
}
