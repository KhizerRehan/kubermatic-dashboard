// Copyright 2022 The Kubermatic Kubernetes Platform contributors.
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

import {Component, forwardRef, OnInit} from '@angular/core';
import {FormBuilder, FormControl, NG_VALIDATORS, NG_VALUE_ACCESSOR, Validators} from '@angular/forms';
import {StepRegistry} from '@app/kubeone-wizard/config';
import {KubeOneClusterSpecService} from '@core/services/kubeone-cluster-spec';
import {KubeOneWizardService} from '@core/services/kubeone-wizard/wizard';
import {NodeProvider} from '@shared/model/NodeProviderConstants';
import {takeUntil} from 'rxjs/operators';
import {StepBase} from '../base';

enum Controls {
  Provider = 'provider',
}

@Component({
  selector: 'km-kubeone-wizard-provider-step',
  templateUrl: './template.html',
  styleUrls: ['./style.scss'],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => KubeOneProviderStepComponent),
      multi: true,
    },
    {
      provide: NG_VALIDATORS,
      useExisting: forwardRef(() => KubeOneProviderStepComponent),
      multi: true,
    },
  ],
  standalone: false,
})
export class KubeOneProviderStepComponent extends StepBase implements OnInit {
  readonly providers: NodeProvider[] = [
    NodeProvider.AWS,
    NodeProvider.GCP,
    NodeProvider.AZURE,
    NodeProvider.DIGITALOCEAN,
    NodeProvider.HETZNER,
    NodeProvider.OPENSTACK,
    NodeProvider.VSPHERE,
  ];
  readonly controls = Controls;

  constructor(
    private readonly _builder: FormBuilder,
    private readonly _clusterSpecService: KubeOneClusterSpecService,
    wizard: KubeOneWizardService
  ) {
    super(wizard, StepRegistry.Provider);
  }

  ngOnInit(): void {
    this._initForm();
    this._initSubscriptions();
  }

  private _initForm(): void {
    this.form = this._builder.group({
      [Controls.Provider]: new FormControl('', [Validators.required]),
    });
  }

  private _initSubscriptions(): void {
    this.control(Controls.Provider)
      .valueChanges.pipe(takeUntil(this._unsubscribe))
      .subscribe((provider: NodeProvider) => {
        this._clusterSpecService.provider = provider;
      });
  }
}
