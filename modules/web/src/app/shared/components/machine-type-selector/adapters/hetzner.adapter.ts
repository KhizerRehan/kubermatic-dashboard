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
 * Hetzner server type format from API
 * Note: Uses 'cores' instead of 'vcpus', memory is in GB
 */
export interface HetznerMachineType {
  id: number;
  name: string;
  description?: string;
  cores: number;
  memory: number; // in GB
  disk: number; // in GB
}

/**
 * Hetzner API response can be grouped (standard/dedicated) or flat array
 */
export interface HetznerGroupedResponse {
  standard?: HetznerMachineType[];
  dedicated?: HetznerMachineType[];
  gpu?: HetznerMachineType[];
}

/**
 * Adapter for Hetzner Cloud server types
 * Handles both flat array and grouped response formats
 */
export class HetznerMachineTypeAdapter extends MachineTypeAdapter<HetznerMachineType> {
  readonly providerType = ProviderType.Hetzner;

  normalize(raw: HetznerMachineType): NormalizedMachineType {
    const gpus = this.extractGpuCount(raw);

    return {
      id: raw.name,
      name: raw.description || raw.name,
      vcpus: raw.cores,
      memoryGB: raw.memory,
      gpus,
      category: this.categorize(gpus),
      description: this.inferHetznerDescription(raw.name, gpus),
      diskGB: raw.disk,
      additionalInfo: {
        hetznerServerId: raw.id,
      },
    };
  }

  normalizeAll(rawData: HetznerMachineType[] | HetznerGroupedResponse): NormalizedMachineType[] {
    // Handle grouped response format (standard, dedicated, gpu)
    if (!Array.isArray(rawData) && typeof rawData === 'object') {
      const grouped = rawData as HetznerGroupedResponse;
      const result: NormalizedMachineType[] = [];

      if (grouped.standard) {
        result.push(...grouped.standard.map(item => this.normalize(item)));
      }
      if (grouped.dedicated) {
        result.push(...grouped.dedicated.map(item => this.normalize(item)));
      }
      if (grouped.gpu) {
        result.push(...grouped.gpu.map(item => this.normalize(item)));
      }

      return result;
    }

    // Handle flat array format
    if (Array.isArray(rawData)) {
      return rawData.map(item => this.normalize(item));
    }

    return [];
  }

  /**
   * Extract GPU count from Hetzner server type
   * Hetzner GPU instances have 'gpu' in the name
   */
  private extractGpuCount(raw: HetznerMachineType): number {
    const lowerName = raw.name.toLowerCase();
    const lowerDesc = (raw.description || '').toLowerCase();

    if (lowerName.includes('gpu') || lowerDesc.includes('gpu')) {
      // Try to extract GPU count from name (e.g., gpu-a100-40)
      const match = lowerName.match(/gpu.*?(\d+)/);
      if (match) {
        return parseInt(match[1], 10);
      }
      return 1;
    }

    return 0;
  }

  /**
   * Infer Hetzner-specific description from server type name
   */
  private inferHetznerDescription(name: string, gpus: number): string {
    const lowerName = name.toLowerCase();

    if (gpus > 0 || lowerName.includes('gpu')) {
      return 'GPU';
    }
    if (lowerName.startsWith('ccx')) {
      return 'Dedicated CPU';
    }
    if (lowerName.startsWith('cpx')) {
      return 'Shared vCPU (AMD)';
    }
    if (lowerName.startsWith('cx')) {
      return 'Shared vCPU (Intel)';
    }
    if (lowerName.startsWith('cax')) {
      return 'Arm64';
    }
    return 'General Purpose';
  }
}
