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

import {NormalizedMachineType, ProviderType} from '../models/machine-type.model';
import {MachineTypeAdapter} from './base.adapter';

/**
 * Azure VM size format from API
 * Note: Different field names (numberOfCores, numberOfGPUs, memoryInMB)
 */
export interface AzureMachineType {
  name: string;
  numberOfCores: number;
  numberOfGPUs?: number;
  memoryInMB: number;
  osDiskSizeInMB?: number;
  resourceDiskSizeInMB?: number;
  maxDataDiskCount?: number;
  acceleratedNetworkingEnabled?: boolean;
}

/**
 * Adapter for Azure VM sizes
 * Handles different field naming conventions and memory conversion
 */
export class AzureMachineTypeAdapter extends MachineTypeAdapter<AzureMachineType> {
  readonly providerType = ProviderType.Azure;

  normalize(raw: AzureMachineType): NormalizedMachineType {
    const gpus = raw.numberOfGPUs ?? 0;
    const memoryGB = this.mbToGb(raw.memoryInMB);

    return {
      id: raw.name,
      name: raw.name,
      vcpus: raw.numberOfCores,
      memoryGB,
      gpus,
      category: this.categorize(gpus),
      description: this.inferAzureDescription(raw.name, gpus),
      additionalInfo: {
        osDiskSizeGB: raw.osDiskSizeInMB ? this.mbToGb(raw.osDiskSizeInMB) : undefined,
        resourceDiskSizeGB: raw.resourceDiskSizeInMB ? this.mbToGb(raw.resourceDiskSizeInMB) : undefined,
        maxDataDiskCount: raw.maxDataDiskCount,
        acceleratedNetworkingEnabled: raw.acceleratedNetworkingEnabled,
      },
    };
  }

  normalizeAll(rawData: AzureMachineType[]): NormalizedMachineType[] {
    if (!Array.isArray(rawData)) {
      return [];
    }
    return rawData.map(item => this.normalize(item));
  }

  /**
   * Infer Azure-specific description from VM size name
   * Azure naming convention: Standard_<Series><Size>_<Version>
   */
  private inferAzureDescription(name: string, gpus: number): string {
    const lowerName = name.toLowerCase();

    if (gpus > 0 || lowerName.includes('_nc') || lowerName.includes('_nd') || lowerName.includes('_nv')) {
      return 'GPU Optimized';
    }
    if (lowerName.includes('_f') || lowerName.includes('_fx')) {
      return 'Compute Optimized';
    }
    if (lowerName.includes('_e') || lowerName.includes('_m')) {
      return 'Memory Optimized';
    }
    if (lowerName.includes('_l')) {
      return 'Storage Optimized';
    }
    if (lowerName.includes('_d') || lowerName.includes('_a')) {
      return 'General Purpose';
    }
    return 'General Purpose';
  }
}
