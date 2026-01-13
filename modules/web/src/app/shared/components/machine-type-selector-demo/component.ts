// Copyright 2026 The Kubermatic Kubernetes Platform contributors.
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

import {Component, OnInit} from '@angular/core';
import {NormalizedMachineType} from '../machine-type-selector/models/machine-type.model';

// Import mock data
import awsData from '../../../../providers/aws.json';
import gcpData from '../../../../providers/gcp.json';
import azureData from '../../../../providers/azure.json';
import hetznerData from '../../../../providers/hetzner-withGPU.json';
import digitaloceanData from '../../../../providers/digitalocean.json';
import openstackData from '../../../../providers/openstack.json';

interface ProviderDemo {
  name: string;
  provider: string;
  data: unknown[] | Record<string, unknown[]>;
  description: string;
}

@Component({
  selector: 'km-machine-type-selector-demo',
  templateUrl: './template.html',
  styleUrls: ['./style.scss'],
  standalone: false,
})
export class MachineTypeSelectorDemoComponent implements OnInit {
  providers: ProviderDemo[] = [];
  selectedProvider: ProviderDemo | null = null;
  selectedMachineType: NormalizedMachineType | null = null;
  selectedMachineTypeId = '';

  ngOnInit(): void {
    this.providers = [
      {
        name: 'AWS',
        provider: 'aws',
        data: awsData,
        description: 'Amazon Web Services - EC2 instances with GPU support',
      },
      {
        name: 'Google Cloud Platform',
        provider: 'gcp',
        data: gcpData,
        description: 'GCP machine types with accelerator-optimized instances',
      },
      {
        name: 'Azure',
        provider: 'azure',
        data: azureData,
        description: 'Microsoft Azure virtual machine sizes',
      },
      {
        name: 'Hetzner',
        provider: 'hetzner',
        data: hetznerData,
        description: 'Hetzner Cloud - Standard, Dedicated, and GPU instances',
      },
      {
        name: 'DigitalOcean',
        provider: 'digitalocean',
        data: digitaloceanData,
        description: 'DigitalOcean Droplets - Standard and optimized',
      },
      {
        name: 'OpenStack',
        provider: 'openstack',
        data: openstackData,
        description: 'OpenStack flavors',
      },
    ];

    // Select first provider by default
    this.selectedProvider = this.providers[0];
  }

  onProviderChange(provider: ProviderDemo): void {
    this.selectedProvider = provider;
    this.selectedMachineType = null;
    this.selectedMachineTypeId = '';
  }

  onMachineTypeSelected(machineType: NormalizedMachineType): void {
    this.selectedMachineType = machineType;
  }

  onSelectionChange(id: string): void {
    this.selectedMachineTypeId = id;
  }

  getDataPreview(): string {
    if (!this.selectedProvider) {
      return '';
    }

    const data = this.selectedProvider.data;
    if (Array.isArray(data)) {
      return JSON.stringify(data.slice(0, 2), null, 2);
    } else {
      // For grouped data like Hetzner, show structure
      const preview: Record<string, unknown> = {};
      Object.keys(data).forEach(key => {
        const group = data[key];
        if (Array.isArray(group)) {
          preview[key] = group.slice(0, 1);
        }
      });
      return JSON.stringify(preview, null, 2);
    }
  }
}
