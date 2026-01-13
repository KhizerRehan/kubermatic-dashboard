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
 * Generic machine type format - tries to handle common field names
 */
export interface GenericMachineType {
  // Name/identifier fields (tries multiple common names)
  name?: string;
  slug?: string;
  id?: string | number;

  // Display name variations
  pretty_name?: string;
  prettyName?: string;
  displayName?: string;
  description?: string;

  // CPU fields
  vcpus?: number;
  vcpu?: number;
  cores?: number;
  cpus?: number;
  numberOfCores?: number;

  // Memory fields (will try to auto-detect unit)
  memory?: number;
  memoryMB?: number;
  memoryGB?: number;
  memoryInMB?: number;
  ram?: number;

  // GPU fields
  gpus?: number;
  gpu?: number;
  numberOfGPUs?: number;

  // Price fields
  price?: number;
  price_hourly?: number;
  pricePerHour?: number;

  // Architecture
  architecture?: string;
  arch?: string;

  // Disk
  disk?: number;
  diskGB?: number;
}

/**
 * Default adapter for generic or unknown provider types
 * Attempts to intelligently map various field naming conventions
 */
export class DefaultMachineTypeAdapter extends MachineTypeAdapter<GenericMachineType> {
  readonly providerType = ProviderType.Default;

  normalize(raw: GenericMachineType): NormalizedMachineType {
    const id = this.extractId(raw);
    const name = this.extractName(raw);
    const vcpus = this.extractVcpus(raw);
    const memoryGB = this.extractMemoryGB(raw);
    const gpus = this.extractGpus(raw);

    return {
      id,
      name,
      vcpus,
      memoryGB,
      gpus,
      category: this.categorize(gpus),
      description: raw.description || this.inferDescription(name, gpus),
      architecture: raw.architecture || raw.arch,
      pricePerHour: raw.price_hourly ?? raw.pricePerHour ?? raw.price,
      diskGB: raw.diskGB ?? raw.disk,
    };
  }

  normalizeAll(rawData: GenericMachineType[] | Record<string, GenericMachineType[]>): NormalizedMachineType[] {
    // Handle grouped response (object with arrays as values)
    if (!Array.isArray(rawData) && typeof rawData === 'object') {
      const result: NormalizedMachineType[] = [];
      for (const key of Object.keys(rawData)) {
        const items = rawData[key];
        if (Array.isArray(items)) {
          result.push(...items.map(item => this.normalize(item)));
        }
      }
      return result;
    }

    // Handle flat array
    if (Array.isArray(rawData)) {
      return rawData.map(item => this.normalize(item));
    }

    return [];
  }

  private extractId(raw: GenericMachineType): string {
    if (raw.name) return raw.name;
    if (raw.slug) return raw.slug;
    if (raw.id !== undefined) return String(raw.id);
    return 'unknown';
  }

  private extractName(raw: GenericMachineType): string {
    return raw.pretty_name || raw.prettyName || raw.displayName || raw.description || this.extractId(raw);
  }

  private extractVcpus(raw: GenericMachineType): number {
    return raw.vcpus ?? raw.vcpu ?? raw.cores ?? raw.cpus ?? raw.numberOfCores ?? 0;
  }

  private extractMemoryGB(raw: GenericMachineType): number {
    // If explicitly in GB
    if (raw.memoryGB !== undefined) return raw.memoryGB;

    // If explicitly in MB
    if (raw.memoryMB !== undefined || raw.memoryInMB !== undefined) {
      return this.mbToGb(raw.memoryMB ?? raw.memoryInMB ?? 0);
    }

    // Try to infer from 'memory' or 'ram' field
    const memory = raw.memory ?? raw.ram;
    if (memory !== undefined) {
      // If memory > 1000, assume MB and convert
      // Most providers use MB when value is large, GB when small
      if (memory > 1000) {
        return this.mbToGb(memory);
      }
      return memory;
    }

    return 0;
  }

  private extractGpus(raw: GenericMachineType): number {
    return raw.gpus ?? raw.gpu ?? raw.numberOfGPUs ?? 0;
  }
}
