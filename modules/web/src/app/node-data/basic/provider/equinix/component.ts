// Copyright 2020 The Kubermatic Kubernetes Platform contributors.
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
  AfterViewInit,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  forwardRef,
  OnDestroy,
  OnInit,
} from '@angular/core';
import {FormBuilder, NG_VALIDATORS, NG_VALUE_ACCESSOR, Validators} from '@angular/forms';
import {NodeDataService} from '@core/services/node-data/service';
import _ from 'lodash';
import {Observable} from 'rxjs';
import {takeUntil, skipWhile, distinctUntilChanged} from 'rxjs/operators';
import {NodeCloudSpec, NodeSpec, EquinixNodeSpec} from '@shared/entity/node';
import {EquinixSize} from '@shared/entity/provider/equinix';
import {NodeData} from '@shared/model/NodeSpecChange';
import {compare} from '@shared/utils/common';
import {BaseFormValidator} from '@shared/validators/base-form.validator';
import {ProjectResourceQuotaPayload} from '@shared/entity/quota';
import {ComboboxControls} from '@shared/components/combobox/component';
import {QuotaCalculationService} from '@dynamic/enterprise/quotas/services/quota-calculation';

enum Controls {
  InstanceType = 'instanceType',
}

enum SizeState {
  Ready = 'Plan',
  Loading = 'Loading...',
  Empty = 'No Plans Available',
}

@Component({
  selector: 'km-equinix-basic-node-data',
  templateUrl: './template.html',
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => EquinixBasicNodeDataComponent),
      multi: true,
    },
    {
      provide: NG_VALIDATORS,
      useExisting: forwardRef(() => EquinixBasicNodeDataComponent),
      multi: true,
    },
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EquinixBasicNodeDataComponent extends BaseFormValidator implements OnInit, OnDestroy, AfterViewInit {
  readonly Controls = Controls;

  sizes: EquinixSize[] = [];
  selectedSize = '';
  sizeLabel = SizeState.Empty;

  constructor(
    private readonly _builder: FormBuilder,
    private readonly _nodeDataService: NodeDataService,
    private readonly _cdr: ChangeDetectorRef,
    private readonly _quotaCalculationService: QuotaCalculationService
  ) {
    super();
  }

  private get _sizesObservable(): Observable<EquinixSize[]> {
    return this._nodeDataService.equinix.flavors(this._clearSize.bind(this), this._onSizeLoading.bind(this));
  }

  ngOnInit(): void {
    this.form = this._builder.group({
      [Controls.InstanceType]: this._builder.control('', Validators.required),
    });

    const instanceType$ = this.form
      .get(Controls.InstanceType)
      .valueChanges.pipe(skipWhile(value => !value?.[ComboboxControls.Select]))
      .pipe(
        distinctUntilChanged(
          (prev: any, curr: any) => prev?.[ComboboxControls.Select] === curr?.[ComboboxControls.Select]
        )
      );

    instanceType$.pipe(takeUntil(this._unsubscribe)).subscribe(_ => {
      this._quotaCalculationService.quotaPayload = this._getQuotaCalculationPayload();
      this._quotaCalculationService.refreshQuotaCalculations();
    });
  }

  ngAfterViewInit() {
    this._sizesObservable.pipe(takeUntil(this._unsubscribe)).subscribe(this._setDefaultSize.bind(this));
  }

  ngOnDestroy(): void {
    this._unsubscribe.next();
    this._unsubscribe.complete();
  }

  onSizeChange(size: string): void {
    this._nodeDataService.nodeData = {
      spec: {
        cloud: {
          packet: {
            instanceType: size,
          } as EquinixNodeSpec,
        } as NodeCloudSpec,
      } as NodeSpec,
    } as NodeData;
  }

  getPlanDetails(size: EquinixSize): string {
    let description = '';
    size.drives = size.drives ? size.drives : [];
    size.cpus = size.cpus ? size.cpus : [];

    for (const cpu of size.cpus) {
      description += `${cpu.count} CPU(s) ${cpu.type}`;
    }

    if (size.memory && size.memory !== 'N/A') {
      description += `, ${size.memory} RAM`;
    }

    for (const drive of size.drives) {
      description += `, ${drive.count}x${drive.size} ${drive.type}`;
    }

    return description ? `(${description})` : '';
  }

  sizeDisplayName(sizeName: string): string {
    const size = this.sizes.find(size => size.name === sizeName);
    if (!size) {
      return sizeName;
    }

    return `${size.name} ${this.getPlanDetails(size)}`;
  }

  private _onSizeLoading(): void {
    this._clearSize();
    this.sizeLabel = SizeState.Loading;
    this._cdr.detectChanges();
  }

  private _clearSize(): void {
    this.selectedSize = '';
    this.sizes = [];
    this.sizeLabel = SizeState.Empty;
    this._cdr.detectChanges();
  }

  private _setDefaultSize(sizes: EquinixSize[]): void {
    this.sizes = sizes.filter(size => size.memory !== 'N/A');
    this.selectedSize = this._nodeDataService.nodeData.spec.cloud.packet
      ? this._nodeDataService.nodeData.spec.cloud.packet.instanceType
      : '';

    if (!this.selectedSize && !_.isEmpty(this.sizes)) {
      this.selectedSize = this._findCheapestInstance(this.sizes).name;
    }

    this.sizeLabel = this.selectedSize ? SizeState.Ready : SizeState.Empty;
    this._cdr.detectChanges();
  }

  private _findCheapestInstance(sizes: EquinixSize[]): EquinixSize {
    // Avoid mutating original array
    return [...sizes]
      .sort((a, b) => compare(this._getMemory(a), this._getMemory(b)))
      .sort((a, b) => compare(this._getCPUCount(a), this._getCPUCount(b)))[0];
  }

  private _getMemory(size: EquinixSize): number {
    return Number.parseInt(size.memory);
  }

  private _getCPUCount(size: EquinixSize): number {
    return size.cpus ? size.cpus.map(s => s.count).reduce((a, b) => a + b) : -1;
  }

  private _getQuotaCalculationPayload(): ProjectResourceQuotaPayload {
    const instanceType = this._nodeDataService.nodeData.spec.cloud.packet.instanceType;
    const selectedInstanceType = this.sizes.find(s => s.name === instanceType);
    return {
      replicas: this._nodeDataService.nodeData.count,
      diskSizeGB: this.form.get(Controls.InstanceType)?.[ComboboxControls.Select],
      equinixSize: {
        ...selectedInstanceType,
      } as EquinixSize,
    };
  }
}
