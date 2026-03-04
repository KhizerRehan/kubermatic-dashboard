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

import {MLAMockService} from './mla-mock';
import {fakeAlertmanagerConfig, fakeRuleGroups} from '../data/mla';

describe('MLAMockService', () => {
  let service: MLAMockService;

  beforeEach(() => {
    service = new MLAMockService();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('Alertmanager Configuration', () => {
    it('should return alertmanager config observable', (done) => {
      service.alertmanagerConfig('proj-1', 'cluster-1').subscribe(config => {
        expect(config === undefined || config.spec).toBeTruthy();
        done();
      });
    });

    it('refreshAlertmanagerConfig should be callable', () => {
      expect(() => service.refreshAlertmanagerConfig()).not.toThrow();
    });

    it('putAlertmanagerConfig should return input config', (done) => {
      const config = fakeAlertmanagerConfig();
      service.putAlertmanagerConfig('proj-1', 'cluster-1', config).subscribe(result => {
        expect(result).toEqual(config);
        done();
      });
    });

    it('resetAlertmanagerConfig should return void observable', (done) => {
      service.resetAlertmanagerConfig('proj-1', 'cluster-1').subscribe(() => {
        done();
      });
    });
  });

  describe('Rule Groups', () => {
    it('should return rule groups observable', (done) => {
      service.ruleGroups('proj-1', 'cluster-1').subscribe(groups => {
        expect(Array.isArray(groups)).toBe(true);
        expect(groups.length).toBeGreaterThan(0);
        done();
      });
    });

    it('should return expected rule group structure', (done) => {
      service.ruleGroups('proj-1', 'cluster-1').subscribe(groups => {
        expect(groups[0].name).toBeTruthy();
        expect(groups[0].data).toBeTruthy();
        done();
      });
    });

    it('refreshRuleGroups should be callable', () => {
      expect(() => service.refreshRuleGroups()).not.toThrow();
    });

    it('createRuleGroup should return input rule group', (done) => {
      const ruleGroup = fakeRuleGroups()[0];
      service.createRuleGroup('proj-1', 'cluster-1', ruleGroup).subscribe(result => {
        expect(result).toEqual(ruleGroup);
        done();
      });
    });

    it('editRuleGroup should return edited rule group', (done) => {
      const ruleGroup = fakeRuleGroups()[0];
      service.editRuleGroup('proj-1', 'cluster-1', ruleGroup).subscribe(result => {
        expect(result).toEqual(ruleGroup);
        done();
      });
    });

    it('deleteRuleGroup should return void observable', (done) => {
      service.deleteRuleGroup('proj-1', 'cluster-1', 'example').subscribe(() => {
        done();
      });
    });
  });

  describe('Admin Rule Groups', () => {
    it('should return admin rule groups observable', (done) => {
      service.adminRuleGroups('us-east-1').subscribe(groups => {
        expect(Array.isArray(groups)).toBe(true);
        expect(groups.length).toBeGreaterThan(0);
        done();
      });
    });

    it('refreshAdminRuleGroups should be callable', () => {
      expect(() => service.refreshAdminRuleGroups()).not.toThrow();
    });

    it('createAdminRuleGroup should return input rule group', (done) => {
      const ruleGroup = fakeRuleGroups()[0];
      service.createAdminRuleGroup('us-east-1', ruleGroup).subscribe(result => {
        expect(result).toEqual(ruleGroup);
        done();
      });
    });

    it('editAdminRuleGroup should return edited rule group', (done) => {
      const ruleGroup = fakeRuleGroups()[0];
      service.editAdminRuleGroup('us-east-1', ruleGroup).subscribe(result => {
        expect(result).toEqual(ruleGroup);
        done();
      });
    });

    it('deleteAdminRuleGroup should return void observable', (done) => {
      service.deleteAdminRuleGroup('us-east-1', 'example').subscribe(() => {
        done();
      });
    });
  });
});
