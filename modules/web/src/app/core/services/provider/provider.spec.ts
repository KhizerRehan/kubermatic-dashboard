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

import {HttpClientTestingModule, HttpTestingController} from '@angular/common/http/testing';
import {TestBed} from '@angular/core/testing';
import {AWSSize, AWSSubnet, Architecture} from '@shared/entity/provider/aws';
import {AzureSizes, AzureZones} from '@shared/entity/provider/azure';
import {GCPDiskType, GCPMachineSize, GCPZone} from '@shared/entity/provider/gcp';
import {OpenstackAvailabilityZone, OpenstackFlavor, OpenstackServerGroup} from '@shared/entity/provider/openstack';
import {AWSService} from './aws';
import {AzureService} from './azure';
import {GCPService} from './gcp';
import {OpenStackService} from './openstack';

describe('Provider Services - Comprehensive Provider-Specific Tests', () => {
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [AWSService, AzureService, GCPService, OpenStackService],
    });

    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  describe('AWS Provider - getSubnets', () => {
    let service: AWSService;

    beforeEach(() => {
      service = TestBed.inject(AWSService);
    });

    it('should fetch subnets with valid project and cluster IDs', () => {
      const projectID = 'test-project-1';
      const clusterID = 'test-cluster-1';
      const mockSubnets: AWSSubnet[] = [
        {
          name: 'subnet-1',
          id: 'subnet-123456',
          availability_zone: 'us-east-1a',
          availability_zone_id: 'use1-az1',
          ipv4cidr: '10.0.1.0/24',
          ipv6cidr: '',
          tags: [{key: 'Name', value: 'test-subnet'}],
          state: 'available',
          available_ip_address_count: 250,
          default: false,
        },
      ];

      service.getSubnets(projectID, clusterID).subscribe(result => {
        expect(result).toEqual(mockSubnets);
        expect(result.length).toBe(1);
        expect(result[0].name).toBe('subnet-1');
      });

      const req = httpMock.expectOne(`/api/v2/projects/test-project-1/clusters/test-cluster-1/providers/aws/subnets`);
      expect(req.request.method).toBe('GET');
      req.flush(mockSubnets);
    });

    it('should handle empty subnets list', () => {
      const projectID = 'test-project-1';
      const clusterID = 'test-cluster-1';

      service.getSubnets(projectID, clusterID).subscribe(result => {
        expect(result).toEqual([]);
        expect(result.length).toBe(0);
      });

      const req = httpMock.expectOne(`/api/v2/projects/test-project-1/clusters/test-cluster-1/providers/aws/subnets`);
      req.flush([]);
    });

    it('should fetch multiple subnets across availability zones', () => {
      const projectID = 'test-project-1';
      const clusterID = 'test-cluster-1';
      const mockSubnets: AWSSubnet[] = [
        {
          name: 'subnet-az1',
          id: 'subnet-111',
          availability_zone: 'us-east-1a',
          availability_zone_id: 'use1-az1',
          ipv4cidr: '10.0.1.0/24',
          ipv6cidr: '2001:db8::/64',
          tags: [{key: 'Environment', value: 'production'}],
          state: 'available',
          available_ip_address_count: 200,
          default: false,
        },
        {
          name: 'subnet-az2',
          id: 'subnet-222',
          availability_zone: 'us-east-1b',
          availability_zone_id: 'use1-az2',
          ipv4cidr: '10.0.2.0/24',
          ipv6cidr: '2001:db8:1::/64',
          tags: [],
          state: 'available',
          available_ip_address_count: 150,
          default: true,
        },
      ];

      service.getSubnets(projectID, clusterID).subscribe(result => {
        expect(result.length).toBe(2);
        expect(result[0].availability_zone).toBe('us-east-1a');
        expect(result[1].availability_zone).toBe('us-east-1b');
      });

      const req = httpMock.expectOne(`/api/v2/projects/test-project-1/clusters/test-cluster-1/providers/aws/subnets`);
      req.flush(mockSubnets);
    });

    it('should handle subnet with multiple tags', () => {
      const projectID = 'test-project-1';
      const clusterID = 'test-cluster-1';
      const mockSubnets: AWSSubnet[] = [
        {
          name: 'tagged-subnet',
          id: 'subnet-tagged',
          availability_zone: 'us-west-2a',
          availability_zone_id: 'usw2-az1',
          ipv4cidr: '172.16.0.0/24',
          ipv6cidr: '',
          tags: [
            {key: 'Environment', value: 'staging'},
            {key: 'Owner', value: 'platform-team'},
            {key: 'CostCenter', value: 'engineering'},
          ],
          state: 'available',
          available_ip_address_count: 240,
          default: false,
        },
      ];

      service.getSubnets(projectID, clusterID).subscribe(result => {
        expect(result[0].tags.length).toBe(3);
        expect(result[0].tags[1].key).toBe('Owner');
      });

      const req = httpMock.expectOne(`/api/v2/projects/test-project-1/clusters/test-cluster-1/providers/aws/subnets`);
      req.flush(mockSubnets);
    });

    it('should handle network error when fetching subnets', () => {
      const projectID = 'test-project-1';
      const clusterID = 'test-cluster-1';

      service.getSubnets(projectID, clusterID).subscribe(
        () => fail('should have errored'),
        error => {
          expect(error.status).toBe(500);
        }
      );

      const req = httpMock.expectOne(`/api/v2/projects/test-project-1/clusters/test-cluster-1/providers/aws/subnets`);
      req.flush('Server error', {status: 500, statusText: 'Internal Server Error'});
    });

    it('should handle 401 Unauthorized error for subnets', () => {
      const projectID = 'test-project-1';
      const clusterID = 'test-cluster-1';

      service.getSubnets(projectID, clusterID).subscribe(
        () => fail('should have errored'),
        error => {
          expect(error.status).toBe(401);
        }
      );

      const req = httpMock.expectOne(`/api/v2/projects/test-project-1/clusters/test-cluster-1/providers/aws/subnets`);
      req.flush('Unauthorized', {status: 401, statusText: 'Unauthorized'});
    });
  });

  describe('AWS Provider - getSizes', () => {
    let service: AWSService;

    beforeEach(() => {
      service = TestBed.inject(AWSService);
    });

    it('should fetch instance sizes with price information', () => {
      const projectID = 'test-project-1';
      const clusterID = 'test-cluster-1';
      const mockSizes: AWSSize[] = [
        {
          name: 't3.micro',
          pretty_name: 'T3 Micro',
          architecture: Architecture.X64,
          memory: 1024,
          vcpus: 1,
          price: 0.0104,
          gpus: 0,
        },
        {
          name: 't3.small',
          pretty_name: 'T3 Small',
          architecture: Architecture.X64,
          memory: 2048,
          vcpus: 2,
          price: 0.0208,
          gpus: 0,
        },
      ];

      service.getSizes(projectID, clusterID).subscribe(result => {
        expect(result.length).toBe(2);
        expect(result[0].name).toBe('t3.micro');
        expect(result[0].vcpus).toBe(1);
        expect(result[0].price).toBe(0.0104);
      });

      const req = httpMock.expectOne(`/api/v2/projects/test-project-1/clusters/test-cluster-1/providers/aws/sizes`);
      expect(req.request.method).toBe('GET');
      req.flush(mockSizes);
    });

    it('should fetch sizes with GPU support', () => {
      const projectID = 'test-project-1';
      const clusterID = 'test-cluster-1';
      const mockSizes: AWSSize[] = [
        {
          name: 'p3.2xlarge',
          pretty_name: 'P3 2xlarge',
          architecture: Architecture.X64,
          memory: 61440,
          vcpus: 8,
          price: 3.06,
          gpus: 1,
        },
        {
          name: 'p3.8xlarge',
          pretty_name: 'P3 8xlarge',
          architecture: Architecture.X64,
          memory: 245760,
          vcpus: 32,
          price: 12.24,
          gpus: 4,
        },
      ];

      service.getSizes(projectID, clusterID).subscribe(result => {
        expect(result[0].gpus).toBe(1);
        expect(result[1].gpus).toBe(4);
      });

      const req = httpMock.expectOne(`/api/v2/projects/test-project-1/clusters/test-cluster-1/providers/aws/sizes`);
      req.flush(mockSizes);
    });

    it('should handle ARM64 architecture instances', () => {
      const projectID = 'test-project-1';
      const clusterID = 'test-cluster-1';
      const mockSizes: AWSSize[] = [
        {
          name: 't4g.micro',
          pretty_name: 'T4g Micro',
          architecture: Architecture.ARM64,
          memory: 1024,
          vcpus: 2,
          price: 0.0084,
          gpus: 0,
        },
      ];

      service.getSizes(projectID, clusterID).subscribe(result => {
        expect(result[0].architecture).toBe(Architecture.ARM64);
      });

      const req = httpMock.expectOne(`/api/v2/projects/test-project-1/clusters/test-cluster-1/providers/aws/sizes`);
      req.flush(mockSizes);
    });

    it('should handle empty sizes list', () => {
      const projectID = 'test-project-1';
      const clusterID = 'test-cluster-1';

      service.getSizes(projectID, clusterID).subscribe(result => {
        expect(result).toEqual([]);
      });

      const req = httpMock.expectOne(`/api/v2/projects/test-project-1/clusters/test-cluster-1/providers/aws/sizes`);
      req.flush([]);
    });

    it('should handle network error when fetching sizes', () => {
      const projectID = 'test-project-1';
      const clusterID = 'test-cluster-1';

      service.getSizes(projectID, clusterID).subscribe(
        () => fail('should have errored'),
        error => {
          expect(error.status).toBe(503);
        }
      );

      const req = httpMock.expectOne(`/api/v2/projects/test-project-1/clusters/test-cluster-1/providers/aws/sizes`);
      req.flush('Service unavailable', {status: 503, statusText: 'Service Unavailable'});
    });
  });

  describe('GCP Provider - getZones', () => {
    let service: GCPService;

    beforeEach(() => {
      service = TestBed.inject(GCPService);
    });

    it('should fetch availability zones for GCP region', () => {
      const projectID = 'test-project-1';
      const clusterID = 'test-cluster-1';
      const mockZones: GCPZone[] = [
        {name: 'us-central1-a'},
        {name: 'us-central1-b'},
        {name: 'us-central1-c'},
      ];

      service.getZones(projectID, clusterID).subscribe(result => {
        expect(result.length).toBe(3);
        expect(result[0].name).toBe('us-central1-a');
      });

      const req = httpMock.expectOne(`/api/v2/projects/test-project-1/clusters/test-cluster-1/providers/gcp/zones`);
      expect(req.request.method).toBe('GET');
      req.flush(mockZones);
    });

    it('should handle single zone availability', () => {
      const projectID = 'test-project-1';
      const clusterID = 'test-cluster-1';
      const mockZones: GCPZone[] = [{name: 'europe-west1-b'}];

      service.getZones(projectID, clusterID).subscribe(result => {
        expect(result.length).toBe(1);
        expect(result[0].name).toBe('europe-west1-b');
      });

      const req = httpMock.expectOne(`/api/v2/projects/test-project-1/clusters/test-cluster-1/providers/gcp/zones`);
      req.flush(mockZones);
    });

    it('should handle empty zones list', () => {
      const projectID = 'test-project-1';
      const clusterID = 'test-cluster-1';

      service.getZones(projectID, clusterID).subscribe(result => {
        expect(result).toEqual([]);
      });

      const req = httpMock.expectOne(`/api/v2/projects/test-project-1/clusters/test-cluster-1/providers/gcp/zones`);
      req.flush([]);
    });

    it('should handle 404 Not Found error for zones', () => {
      const projectID = 'invalid-project';
      const clusterID = 'invalid-cluster';

      service.getZones(projectID, clusterID).subscribe(
        () => fail('should have errored'),
        error => {
          expect(error.status).toBe(404);
        }
      );

      const req = httpMock.expectOne(`/api/v2/projects/invalid-project/clusters/invalid-cluster/providers/gcp/zones`);
      req.flush('Not found', {status: 404, statusText: 'Not Found'});
    });
  });

  describe('GCP Provider - getSizes', () => {
    let service: GCPService;

    beforeEach(() => {
      service = TestBed.inject(GCPService);
    });

    it('should fetch machine sizes with zone header', () => {
      const projectID = 'test-project-1';
      const clusterID = 'test-cluster-1';
      const zone = 'us-central1-a';
      const mockSizes: GCPMachineSize[] = [
        {
          name: 'n1-standard-1',
          description: 'N1 Standard 1 vCPU, 3.75 GB RAM',
          memory: 3840,
          vcpus: 1,
        },
        {
          name: 'n1-standard-4',
          description: 'N1 Standard 4 vCPUs, 15 GB RAM',
          memory: 15360,
          vcpus: 4,
        },
      ];

      service.getSizes(zone, projectID, clusterID).subscribe(result => {
        expect(result.length).toBe(2);
        expect(result[0].vcpus).toBe(1);
        expect(result[1].vcpus).toBe(4);
      });

      const req = httpMock.expectOne(`/api/v2/projects/test-project-1/clusters/test-cluster-1/providers/gcp/sizes`);
      expect(req.request.headers.get('Zone')).toBe('us-central1-a');
      expect(req.request.method).toBe('GET');
      req.flush(mockSizes);
    });

    it('should fetch sizes with GPU accelerators', () => {
      const projectID = 'test-project-1';
      const clusterID = 'test-cluster-1';
      const zone = 'us-central1-a';
      const mockSizes: GCPMachineSize[] = [
        {
          name: 'n1-standard-4-gpu',
          description: 'N1 Standard 4 vCPUs with GPU',
          memory: 15360,
          vcpus: 4,
          accelerators: [
            {
              guestAcceleratorType: 'nvidia-tesla-k80',
              guestAcceleratorCount: 1,
            },
          ],
        },
      ];

      service.getSizes(zone, projectID, clusterID).subscribe(result => {
        expect(result[0].accelerators).toBeDefined();
        expect(result[0].accelerators![0].guestAcceleratorCount).toBe(1);
      });

      const req = httpMock.expectOne(`/api/v2/projects/test-project-1/clusters/test-cluster-1/providers/gcp/sizes`);
      expect(req.request.headers.get('Zone')).toBe(zone);
      req.flush(mockSizes);
    });

    it('should handle different zones for sizing', () => {
      const projectID = 'test-project-1';
      const clusterID = 'test-cluster-1';
      const zone1 = 'us-central1-a';
      const zone2 = 'europe-west1-b';

      service.getSizes(zone1, projectID, clusterID).subscribe();
      service.getSizes(zone2, projectID, clusterID).subscribe();

      const requests = httpMock.match(`/api/v2/projects/test-project-1/clusters/test-cluster-1/providers/gcp/sizes`);
      expect(requests.length).toBe(2);
      expect(requests[0].request.headers.get('Zone')).toBe(zone1);
      expect(requests[1].request.headers.get('Zone')).toBe(zone2);
      requests.forEach(req => req.flush([]));
    });

    it('should handle empty sizes list for zone', () => {
      const projectID = 'test-project-1';
      const clusterID = 'test-cluster-1';
      const zone = 'us-east1-a';

      service.getSizes(zone, projectID, clusterID).subscribe(result => {
        expect(result).toEqual([]);
      });

      const req = httpMock.expectOne(`/api/v2/projects/test-project-1/clusters/test-cluster-1/providers/gcp/sizes`);
      expect(req.request.headers.get('Zone')).toBe(zone);
      req.flush([]);
    });
  });

  describe('GCP Provider - getDiskTypes', () => {
    let service: GCPService;

    beforeEach(() => {
      service = TestBed.inject(GCPService);
    });

    it('should fetch disk types with zone header', () => {
      const projectID = 'test-project-1';
      const clusterID = 'test-cluster-1';
      const zone = 'us-central1-a';
      const mockDiskTypes: GCPDiskType[] = [
        {name: 'pd-standard', description: 'Standard persistent disk'},
        {name: 'pd-balanced', description: 'Balanced persistent disk'},
        {name: 'pd-ssd', description: 'SSD persistent disk'},
      ];

      service.getDiskTypes(zone, projectID, clusterID).subscribe(result => {
        expect(result.length).toBe(3);
        expect(result[0].name).toBe('pd-standard');
      });

      const req = httpMock.expectOne(`/api/v2/projects/test-project-1/clusters/test-cluster-1/providers/gcp/disktypes`);
      expect(req.request.headers.get('Zone')).toBe(zone);
      expect(req.request.method).toBe('GET');
      req.flush(mockDiskTypes);
    });

    it('should handle different disk types per zone', () => {
      const projectID = 'test-project-1';
      const clusterID = 'test-cluster-1';
      const zone = 'europe-west1-b';

      service.getDiskTypes(zone, projectID, clusterID).subscribe();

      const req = httpMock.expectOne(`/api/v2/projects/test-project-1/clusters/test-cluster-1/providers/gcp/disktypes`);
      expect(req.request.headers.get('Zone')).toBe(zone);
      req.flush([]);
    });

    it('should handle 403 Forbidden error for disk types', () => {
      const projectID = 'test-project-1';
      const clusterID = 'test-cluster-1';
      const zone = 'us-central1-a';

      service.getDiskTypes(zone, projectID, clusterID).subscribe(
        () => fail('should have errored'),
        error => {
          expect(error.status).toBe(403);
        }
      );

      const req = httpMock.expectOne(`/api/v2/projects/test-project-1/clusters/test-cluster-1/providers/gcp/disktypes`);
      req.flush('Forbidden', {status: 403, statusText: 'Forbidden'});
    });
  });

  describe('Azure Provider - getSizes', () => {
    let service: AzureService;

    beforeEach(() => {
      service = TestBed.inject(AzureService);
    });

    it('should fetch Azure VM sizes with specifications', () => {
      const projectID = 'test-project-1';
      const clusterID = 'test-cluster-1';
      const mockSizes: AzureSizes[] = [
        {
          name: 'Standard_B1s',
          numberOfCores: 1,
          numberOfGPUs: 0,
          osDiskSizeInMB: 30720,
          resourceDiskSizeInMB: 4096,
          memoryInMB: 1024,
          maxDataDiskCount: 2,
          acceleratedNetworkingEnabled: false,
        },
        {
          name: 'Standard_D2s_v3',
          numberOfCores: 2,
          numberOfGPUs: 0,
          osDiskSizeInMB: 30720,
          resourceDiskSizeInMB: 8192,
          memoryInMB: 8192,
          maxDataDiskCount: 4,
          acceleratedNetworkingEnabled: true,
        },
      ];

      service.getSizes(projectID, clusterID).subscribe(result => {
        expect(result.length).toBe(2);
        expect(result[0].name).toBe('Standard_B1s');
        expect(result[1].acceleratedNetworkingEnabled).toBe(true);
      });

      const req = httpMock.expectOne(`/api/v2/projects/test-project-1/clusters/test-cluster-1/providers/azure/sizes`);
      expect(req.request.method).toBe('GET');
      req.flush(mockSizes);
    });

    it('should handle GPU-enabled sizes', () => {
      const projectID = 'test-project-1';
      const clusterID = 'test-cluster-1';
      const mockSizes: AzureSizes[] = [
        {
          name: 'Standard_NC6s_v3',
          numberOfCores: 6,
          numberOfGPUs: 1,
          osDiskSizeInMB: 30720,
          resourceDiskSizeInMB: 360448,
          memoryInMB: 114688,
          maxDataDiskCount: 12,
          acceleratedNetworkingEnabled: true,
        },
      ];

      service.getSizes(projectID, clusterID).subscribe(result => {
        expect(result[0].numberOfGPUs).toBe(1);
        expect(result[0].numberOfCores).toBe(6);
      });

      const req = httpMock.expectOne(`/api/v2/projects/test-project-1/clusters/test-cluster-1/providers/azure/sizes`);
      req.flush(mockSizes);
    });

    it('should handle empty sizes list', () => {
      const projectID = 'test-project-1';
      const clusterID = 'test-cluster-1';

      service.getSizes(projectID, clusterID).subscribe(result => {
        expect(result).toEqual([]);
      });

      const req = httpMock.expectOne(`/api/v2/projects/test-project-1/clusters/test-cluster-1/providers/azure/sizes`);
      req.flush([]);
    });

    it('should handle 500 Server Error for sizes', () => {
      const projectID = 'test-project-1';
      const clusterID = 'test-cluster-1';

      service.getSizes(projectID, clusterID).subscribe(
        () => fail('should have errored'),
        error => {
          expect(error.status).toBe(500);
        }
      );

      const req = httpMock.expectOne(`/api/v2/projects/test-project-1/clusters/test-cluster-1/providers/azure/sizes`);
      req.flush('Internal server error', {status: 500, statusText: 'Internal Server Error'});
    });
  });

  describe('Azure Provider - getAvailabilityZones', () => {
    let service: AzureService;

    beforeEach(() => {
      service = TestBed.inject(AzureService);
    });

    it('should fetch availability zones for specific SKU', () => {
      const projectID = 'test-project-1';
      const clusterID = 'test-cluster-1';
      const sku = 'Standard_D2s_v3';
      const mockZones: AzureZones = {
        zones: ['1', '2', '3'],
      };

      service.getAvailabilityZones(projectID, clusterID, sku).subscribe(result => {
        expect(result.zones.length).toBe(3);
        expect(result.zones[0]).toBe('1');
      });

      const req = httpMock.expectOne(
        `/api/v2/projects/test-project-1/clusters/test-cluster-1/providers/azure/availabilityzones`
      );
      expect(req.request.headers.get('SKUName')).toBe(sku);
      expect(req.request.method).toBe('GET');
      req.flush(mockZones);
    });

    it('should handle different SKU types for zone availability', () => {
      const projectID = 'test-project-1';
      const clusterID = 'test-cluster-1';
      const sku = 'Standard_B1s';
      const mockZones: AzureZones = {
        zones: ['1', '2'],
      };

      service.getAvailabilityZones(projectID, clusterID, sku).subscribe(result => {
        expect(result.zones.length).toBe(2);
      });

      const req = httpMock.expectOne(
        `/api/v2/projects/test-project-1/clusters/test-cluster-1/providers/azure/availabilityzones`
      );
      expect(req.request.headers.get('SKUName')).toBe(sku);
      req.flush(mockZones);
    });

    it('should handle single zone availability', () => {
      const projectID = 'test-project-1';
      const clusterID = 'test-cluster-1';
      const sku = 'Standard_A1_v2';
      const mockZones: AzureZones = {
        zones: ['1'],
      };

      service.getAvailabilityZones(projectID, clusterID, sku).subscribe(result => {
        expect(result.zones.length).toBe(1);
      });

      const req = httpMock.expectOne(
        `/api/v2/projects/test-project-1/clusters/test-cluster-1/providers/azure/availabilityzones`
      );
      expect(req.request.headers.get('SKUName')).toBe(sku);
      req.flush(mockZones);
    });

    it('should handle no zone availability', () => {
      const projectID = 'test-project-1';
      const clusterID = 'test-cluster-1';
      const sku = 'Standard_B1s';
      const mockZones: AzureZones = {
        zones: [],
      };

      service.getAvailabilityZones(projectID, clusterID, sku).subscribe(result => {
        expect(result.zones.length).toBe(0);
      });

      const req = httpMock.expectOne(
        `/api/v2/projects/test-project-1/clusters/test-cluster-1/providers/azure/availabilityzones`
      );
      req.flush(mockZones);
    });

    it('should handle 403 Forbidden error for availability zones', () => {
      const projectID = 'test-project-1';
      const clusterID = 'test-cluster-1';
      const sku = 'Standard_D2s_v3';

      service.getAvailabilityZones(projectID, clusterID, sku).subscribe(
        () => fail('should have errored'),
        error => {
          expect(error.status).toBe(403);
        }
      );

      const req = httpMock.expectOne(
        `/api/v2/projects/test-project-1/clusters/test-cluster-1/providers/azure/availabilityzones`
      );
      req.flush('Forbidden', {status: 403, statusText: 'Forbidden'});
    });
  });

  describe('OpenStack Provider - getFlavors', () => {
    let service: OpenStackService;

    beforeEach(() => {
      service = TestBed.inject(OpenStackService);
    });

    it('should fetch OpenStack instance flavors', () => {
      const projectID = 'test-project-1';
      const clusterID = 'test-cluster-1';
      const mockFlavors: OpenstackFlavor[] = [
        {
          disk: 50,
          isPublic: true,
          memory: 2048,
          region: 'RegionOne',
          slug: 'm1.small',
          swap: 0,
          vcpus: 1,
        },
        {
          disk: 100,
          isPublic: true,
          memory: 8192,
          region: 'RegionOne',
          slug: 'm1.large',
          swap: 0,
          vcpus: 4,
        },
      ];

      service.getFlavors(projectID, clusterID).subscribe(result => {
        expect(result.length).toBe(2);
        expect(result[0].slug).toBe('m1.small');
        expect(result[0].vcpus).toBe(1);
      });

      const req = httpMock.expectOne(`/api/v2/projects/test-project-1/clusters/test-cluster-1/providers/openstack/sizes`);
      expect(req.request.method).toBe('GET');
      req.flush(mockFlavors);
    });

    it('should handle private flavors', () => {
      const projectID = 'test-project-1';
      const clusterID = 'test-cluster-1';
      const mockFlavors: OpenstackFlavor[] = [
        {
          disk: 200,
          isPublic: false,
          memory: 16384,
          region: 'RegionOne',
          slug: 'custom.large',
          swap: 4096,
          vcpus: 8,
        },
      ];

      service.getFlavors(projectID, clusterID).subscribe(result => {
        expect(result[0].isPublic).toBe(false);
        expect(result[0].swap).toBe(4096);
      });

      const req = httpMock.expectOne(`/api/v2/projects/test-project-1/clusters/test-cluster-1/providers/openstack/sizes`);
      req.flush(mockFlavors);
    });

    it('should handle empty flavors list', () => {
      const projectID = 'test-project-1';
      const clusterID = 'test-cluster-1';

      service.getFlavors(projectID, clusterID).subscribe(result => {
        expect(result).toEqual([]);
      });

      const req = httpMock.expectOne(`/api/v2/projects/test-project-1/clusters/test-cluster-1/providers/openstack/sizes`);
      req.flush([]);
    });

    it('should handle 401 Unauthorized error for flavors', () => {
      const projectID = 'test-project-1';
      const clusterID = 'test-cluster-1';

      service.getFlavors(projectID, clusterID).subscribe(
        () => fail('should have errored'),
        error => {
          expect(error.status).toBe(401);
        }
      );

      const req = httpMock.expectOne(`/api/v2/projects/test-project-1/clusters/test-cluster-1/providers/openstack/sizes`);
      req.flush('Unauthorized', {status: 401, statusText: 'Unauthorized'});
    });
  });

  describe('OpenStack Provider - getServerGroups', () => {
    let service: OpenStackService;

    beforeEach(() => {
      service = TestBed.inject(OpenStackService);
    });

    it('should fetch server groups for anti-affinity', () => {
      const projectID = 'test-project-1';
      const clusterID = 'test-cluster-1';
      const mockGroups: OpenstackServerGroup[] = [
        {
          id: 'group-123',
          name: 'anti-affinity-group-1',
        },
        {
          id: 'group-456',
          name: 'anti-affinity-group-2',
        },
      ];

      service.getServerGroups(projectID, clusterID).subscribe(result => {
        expect(result.length).toBe(2);
        expect(result[0].name).toBe('anti-affinity-group-1');
      });

      const req = httpMock.expectOne(
        `/api/v2/projects/test-project-1/clusters/test-cluster-1/providers/openstack/servergroups`
      );
      expect(req.request.method).toBe('GET');
      req.flush(mockGroups);
    });

    it('should handle single server group', () => {
      const projectID = 'test-project-1';
      const clusterID = 'test-cluster-1';
      const mockGroups: OpenstackServerGroup[] = [
        {
          id: 'single-group',
          name: 'default-group',
        },
      ];

      service.getServerGroups(projectID, clusterID).subscribe(result => {
        expect(result.length).toBe(1);
        expect(result[0].id).toBe('single-group');
      });

      const req = httpMock.expectOne(
        `/api/v2/projects/test-project-1/clusters/test-cluster-1/providers/openstack/servergroups`
      );
      req.flush(mockGroups);
    });

    it('should handle empty server groups list', () => {
      const projectID = 'test-project-1';
      const clusterID = 'test-cluster-1';

      service.getServerGroups(projectID, clusterID).subscribe(result => {
        expect(result).toEqual([]);
      });

      const req = httpMock.expectOne(
        `/api/v2/projects/test-project-1/clusters/test-cluster-1/providers/openstack/servergroups`
      );
      req.flush([]);
    });

    it('should handle 404 Not Found error for server groups', () => {
      const projectID = 'invalid-project';
      const clusterID = 'invalid-cluster';

      service.getServerGroups(projectID, clusterID).subscribe(
        () => fail('should have errored'),
        error => {
          expect(error.status).toBe(404);
        }
      );

      const req = httpMock.expectOne(
        `/api/v2/projects/invalid-project/clusters/invalid-cluster/providers/openstack/servergroups`
      );
      req.flush('Not found', {status: 404, statusText: 'Not Found'});
    });
  });

  describe('OpenStack Provider - getAvailabilityZones', () => {
    let service: OpenStackService;

    beforeEach(() => {
      service = TestBed.inject(OpenStackService);
    });

    it('should fetch OpenStack availability zones', () => {
      const projectID = 'test-project-1';
      const clusterID = 'test-cluster-1';
      const mockZones: OpenstackAvailabilityZone[] = [
        {name: 'nova'},
        {name: 'nova-extended'},
      ];

      service.getAvailabilityZones(projectID, clusterID).subscribe(result => {
        expect(result.length).toBe(2);
        expect(result[0].name).toBe('nova');
      });

      const req = httpMock.expectOne(
        `/api/v2/projects/test-project-1/clusters/test-cluster-1/providers/openstack/availabilityzones`
      );
      expect(req.request.method).toBe('GET');
      req.flush(mockZones);
    });

    it('should handle single availability zone', () => {
      const projectID = 'test-project-1';
      const clusterID = 'test-cluster-1';
      const mockZones: OpenstackAvailabilityZone[] = [{name: 'default'}];

      service.getAvailabilityZones(projectID, clusterID).subscribe(result => {
        expect(result.length).toBe(1);
        expect(result[0].name).toBe('default');
      });

      const req = httpMock.expectOne(
        `/api/v2/projects/test-project-1/clusters/test-cluster-1/providers/openstack/availabilityzones`
      );
      req.flush(mockZones);
    });

    it('should handle empty availability zones list', () => {
      const projectID = 'test-project-1';
      const clusterID = 'test-cluster-1';

      service.getAvailabilityZones(projectID, clusterID).subscribe(result => {
        expect(result).toEqual([]);
      });

      const req = httpMock.expectOne(
        `/api/v2/projects/test-project-1/clusters/test-cluster-1/providers/openstack/availabilityzones`
      );
      req.flush([]);
    });

    it('should handle 503 Service Unavailable error for zones', () => {
      const projectID = 'test-project-1';
      const clusterID = 'test-cluster-1';

      service.getAvailabilityZones(projectID, clusterID).subscribe(
        () => fail('should have errored'),
        error => {
          expect(error.status).toBe(503);
        }
      );

      const req = httpMock.expectOne(
        `/api/v2/projects/test-project-1/clusters/test-cluster-1/providers/openstack/availabilityzones`
      );
      req.flush('Service unavailable', {status: 503, statusText: 'Service Unavailable'});
    });
  });

  describe('Provider Services - Cross-Provider Consistency', () => {
    it('should handle project and cluster IDs consistently across providers', () => {
      const projectID = 'test-project';
      const clusterID = 'test-cluster';
      const awsService = TestBed.inject(AWSService);
      const gcpService = TestBed.inject(GCPService);
      const azureService = TestBed.inject(AzureService);

      awsService.getSubnets(projectID, clusterID).subscribe();
      gcpService.getZones(projectID, clusterID).subscribe();
      azureService.getSizes(projectID, clusterID).subscribe();

      const requests = httpMock.match(req => req.url.includes(projectID) && req.url.includes(clusterID));
      expect(requests.length).toBe(3);
      requests.forEach(req => req.flush([]));
    });

    it('should handle multiple concurrent provider calls', () => {
      const projectID = 'test-project-1';
      const clusterID = 'test-cluster-1';
      const awsService = TestBed.inject(AWSService);
      const gcpService = TestBed.inject(GCPService);

      awsService.getSubnets(projectID, clusterID).subscribe();
      awsService.getSizes(projectID, clusterID).subscribe();
      gcpService.getZones(projectID, clusterID).subscribe();

      const requests = httpMock.match(`/api/v2/projects/${projectID}/clusters/${clusterID}/providers/aws/subnets`);
      const awsSizeReqs = httpMock.match(`/api/v2/projects/${projectID}/clusters/${clusterID}/providers/aws/sizes`);
      const gcpZoneReqs = httpMock.match(`/api/v2/projects/${projectID}/clusters/${clusterID}/providers/gcp/zones`);

      expect(requests.length).toBe(1);
      expect(awsSizeReqs.length).toBe(1);
      expect(gcpZoneReqs.length).toBe(1);

      requests[0].flush([]);
      awsSizeReqs[0].flush([]);
      gcpZoneReqs[0].flush([]);
    });
  });

  describe('Provider Services - Edge Cases', () => {
    it('should handle very large response payloads', () => {
      const service = TestBed.inject(AWSService);
      const projectID = 'test-project-1';
      const clusterID = 'test-cluster-1';
      const largeSizesList: AWSSize[] = Array.from({length: 1000}, (_, i) => ({
        name: `size-${i}`,
        pretty_name: `Size ${i}`,
        architecture: i % 2 === 0 ? Architecture.X64 : Architecture.ARM64,
        memory: 1024 * (i + 1),
        vcpus: (i % 16) + 1,
        price: Math.random() * 10,
        gpus: i % 10 === 0 ? 1 : 0,
      }));

      service.getSizes(projectID, clusterID).subscribe(result => {
        expect(result.length).toBe(1000);
        expect(result[999].name).toBe('size-999');
      });

      const req = httpMock.expectOne(`/api/v2/projects/test-project-1/clusters/test-cluster-1/providers/aws/sizes`);
      req.flush(largeSizesList);
    });

    it('should handle special characters in provider resource names', () => {
      const service = TestBed.inject(AWSService);
      const projectID = 'test-project-1';
      const clusterID = 'test-cluster-1';
      const mockSubnets: AWSSubnet[] = [
        {
          name: 'subnet-with-special-chars-@#$%',
          id: 'subnet-special-123',
          availability_zone: 'us-east-1a',
          availability_zone_id: 'use1-az1',
          ipv4cidr: '10.0.1.0/24',
          ipv6cidr: '',
          tags: [{key: 'Name', value: 'test-subnet-with-@#$%'}],
          state: 'available',
          available_ip_address_count: 250,
          default: false,
        },
      ];

      service.getSubnets(projectID, clusterID).subscribe(result => {
        expect(result[0].name).toContain('@#$%');
      });

      const req = httpMock.expectOne(`/api/v2/projects/test-project-1/clusters/test-cluster-1/providers/aws/subnets`);
      req.flush(mockSubnets);
    });
  });
});
