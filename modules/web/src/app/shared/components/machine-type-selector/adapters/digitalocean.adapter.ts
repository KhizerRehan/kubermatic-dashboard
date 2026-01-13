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
 * DigitalOcean droplet size format from API
 * Note: Uses 'slug' as identifier, memory in MB
 */
export interface DigitalOceanMachineType {
  slug: string;
  available?: boolean;
  transfer?: number;
  price_monthly?: number;
  price_hourly?: number;
  memory: number; // in MB
  vcpus: number;
  disk: number; // in GB
  regions?: string[];
  description?: string;
}

/**
 * DigitalOcean API response can be grouped or flat array
 */
export interface DigitalOceanGroupedResponse {
  standard?: DigitalOceanMachineType[];
  gpu?: DigitalOceanMachineType[];
  cpu?: DigitalOceanMachineType[];
  memory?: DigitalOceanMachineType[];
}

/**
 * Adapter for DigitalOcean droplet sizes
 * Handles both flat array and grouped response formats
 */
export class DigitalOceanMachineTypeAdapter extends MachineTypeAdapter<DigitalOceanMachineType> {
  readonly providerType = ProviderType.DigitalOcean;

  normalize(raw: DigitalOceanMachineType): NormalizedMachineType {
    const gpus = this.extractGpuCount(raw);
    const memoryGB = this.mbToGb(raw.memory);

    return {
      id: raw.slug,
      name: this.formatSlugAsName(raw.slug),
      vcpus: raw.vcpus,
      memoryGB,
      gpus,
      category: this.categorize(gpus),
      description: this.inferDoDescription(raw.slug, gpus),
      pricePerHour: raw.price_hourly,
      diskGB: raw.disk,
      additionalInfo: {
        priceMonthly: raw.price_monthly,
        available: raw.available,
        regions: raw.regions,
      },
    };
  }

  normalizeAll(rawData: DigitalOceanMachineType[] | DigitalOceanGroupedResponse): NormalizedMachineType[] {
    // Handle grouped response format
    if (!Array.isArray(rawData) && typeof rawData === 'object') {
      const grouped = rawData as DigitalOceanGroupedResponse;
      const result: NormalizedMachineType[] = [];

      if (grouped.standard) {
        result.push(...grouped.standard.map(item => this.normalize(item)));
      }
      if (grouped.gpu) {
        result.push(...grouped.gpu.map(item => this.normalize(item)));
      }
      if (grouped.cpu) {
        result.push(...grouped.cpu.map(item => this.normalize(item)));
      }
      if (grouped.memory) {
        result.push(...grouped.memory.map(item => this.normalize(item)));
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
   * Extract GPU count from DigitalOcean droplet size
   * DigitalOcean GPU droplets have 'gpu' in the slug
   */
  private extractGpuCount(raw: DigitalOceanMachineType): number {
    const lowerSlug = raw.slug.toLowerCase();

    if (lowerSlug.includes('gpu')) {
      // Try to extract GPU count (e.g., gpu-h100x8)
      const match = lowerSlug.match(/gpu.*?(\d+)/);
      if (match) {
        return parseInt(match[1], 10);
      }
      return 1;
    }

    return 0;
  }

  /**
   * Format slug into a more readable name
   * e.g., s-2vcpu-4gb -> S 2vCPU 4GB
   */
  private formatSlugAsName(slug: string): string {
    return slug
      .replace(/-/g, ' ')
      .replace(/vcpu/gi, 'vCPU')
      .replace(/gb/gi, 'GB')
      .replace(/\b\w/g, l => l.toUpperCase());
  }

  /**
   * Infer DigitalOcean-specific description from slug
   */
  private inferDoDescription(slug: string, gpus: number): string {
    const lowerSlug = slug.toLowerCase();

    if (gpus > 0 || lowerSlug.includes('gpu')) {
      return 'GPU Optimized';
    }
    if (lowerSlug.startsWith('c-') || lowerSlug.includes('cpu')) {
      return 'CPU Optimized';
    }
    if (lowerSlug.startsWith('m-') || lowerSlug.includes('memory')) {
      return 'Memory Optimized';
    }
    if (lowerSlug.startsWith('so-') || lowerSlug.includes('storage')) {
      return 'Storage Optimized';
    }
    if (lowerSlug.startsWith('g-') || lowerSlug.includes('general')) {
      return 'General Purpose';
    }
    if (lowerSlug.startsWith('s-')) {
      return 'Basic';
    }
    if (lowerSlug.includes('amd')) {
      return 'AMD Premium';
    }
    if (lowerSlug.includes('intel')) {
      return 'Intel Premium';
    }
    return 'Standard';
  }
}
