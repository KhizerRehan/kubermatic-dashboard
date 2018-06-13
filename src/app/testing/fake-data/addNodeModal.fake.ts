import { AddNodeModalData } from '../../shared/model/add-node-modal-data';
import { fakeNodeDatacenters } from './datacenter.fake';
import { fakeDigitaloceanCluster } from './cluster.fake';
import { DigitaloceanSizes } from '../../shared/entity/provider/digitalocean/DropletSizeEntity';
import { AzureSizes } from '../../shared/entity/provider/azure/AzureSizeEntity';
import { OpenstackFlavor } from '../../shared/entity/provider/openstack/OpenstackSizeEntity';

export const addNodeModalFake: AddNodeModalData = {
  cluster: fakeDigitaloceanCluster,
  dc: fakeNodeDatacenters[0]
};

export const fakeDigitaloceanSizes: DigitaloceanSizes = {
  standard: [
    {
      available: true,
      disk: 20,
      memory: 2,
      vcpus: 2,
      price_hourly: 2,
      price_monthly: 2,
      regions: ['sfo'],
      slug: 'test1',
      transfer: 1,
    }
  ],
  optimized: [],
};

export const fakeOpenstackFlavors: OpenstackFlavor[] = [
  {
    vcpus: 1,
    disk: 50,
    isPublic: true,
    memory: 1024,
    region: 'os1',
    slug: 'tiny-m1',
    swap: 0,
  },
];

export const fakeAzureSizes: AzureSizes[] = [
  {
    name: 'Standard_A0',
    maxDataDiskCount: 1,
    memoryInMB: 768,
    numberOfCores: 1,
    osDiskSizeInMB: 1047552,
    resourceDiskSizeInMB: 20480,
  },
];
