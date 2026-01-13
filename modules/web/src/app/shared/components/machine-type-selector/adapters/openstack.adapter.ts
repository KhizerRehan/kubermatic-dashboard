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
 * OpenStack flavor format from API
 * Note: Uses 'slug' as identifier, memory in MB
 */
export interface OpenStackMachineType {
  slug: string;
  memory: number; // in MB
  vcpus: number;
  disk: number; // in GB
  swap?: number;
  region?: string;
  isPublic?: boolean;
}

/**
 * Adapter for OpenStack flavors
 */
export class OpenStackMachineTypeAdapter extends MachineTypeAdapter<OpenStackMachineType> {
  readonly providerType = ProviderType.OpenStack;

  normalize(raw: OpenStackMachineType): NormalizedMachineType {
    const gpus = this.extractGpuCount(raw);
    const memoryGB = this.mbToGb(raw.memory);

    return {
      id: raw.slug,
      name: raw.slug,
      vcpus: raw.vcpus,
      memoryGB,
      gpus,
      category: this.categorize(gpus),
      description: this.inferOpenStackDescription(raw.slug, gpus),
      diskGB: raw.disk,
      additionalInfo: {
        swap: raw.swap,
        region: raw.region,
        isPublic: raw.isPublic,
      },
    };
  }

  normalizeAll(rawData: OpenStackMachineType[]): NormalizedMachineType[] {
    if (!Array.isArray(rawData)) {
      return [];
    }
    return rawData.map(item => this.normalize(item));
  }

  /**
   * Extract GPU count from OpenStack flavor
   * OpenStack GPU flavors typically have 'gpu' or 'g' prefix in the name
   */
  private extractGpuCount(raw: OpenStackMachineType): number {
    const lowerSlug = raw.slug.toLowerCase();

    if (lowerSlug.includes('gpu')) {
      // Try to extract GPU count (e.g., g1.xlarge-gpu2)
      const match = lowerSlug.match(/gpu(\d+)/);
      if (match) {
        return parseInt(match[1], 10);
      }
      return 1;
    }

    // Check for GPU prefixes like g1, g2
    if (/^g\d/.test(lowerSlug)) {
      return 1;
    }

    return 0;
  }

  /**
   * Infer OpenStack-specific description from flavor name
   * Common OpenStack naming: <type><version>.<size>
   * e.g., m1.small, c1.large, l1r.xlarge
   */
  private inferOpenStackDescription(slug: string, gpus: number): string {
    const lowerSlug = slug.toLowerCase();

    if (gpus > 0 || lowerSlug.includes('gpu') || /^g\d/.test(lowerSlug)) {
      return 'GPU Optimized';
    }
    // Compute optimized (c prefix)
    if (/^c\d/.test(lowerSlug)) {
      return 'Compute Optimized';
    }
    // Memory optimized (r suffix or m prefix with r)
    if (lowerSlug.includes('r.') || /r\d*\./.test(lowerSlug)) {
      return 'Memory Optimized';
    }
    // Large storage (l prefix)
    if (/^l\d/.test(lowerSlug)) {
      return 'Storage Optimized';
    }
    // General purpose (m prefix)
    if (/^m\d/.test(lowerSlug)) {
      return 'General Purpose';
    }
    return 'Standard';
  }
}
