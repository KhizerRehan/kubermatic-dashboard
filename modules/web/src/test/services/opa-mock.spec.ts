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

import {OPAMockService} from './opa-mock';
import {fakeConstraintTemplates} from '../data/opa';

describe('OPAMockService', () => {
  let service: OPAMockService;

  beforeEach(() => {
    service = new OPAMockService();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('Constraint Templates', () => {
    it('should return constraint templates observable', (done) => {
      service.constraintTemplates.subscribe(templates => {
        expect(Array.isArray(templates)).toBe(true);
        expect(templates.length).toBeGreaterThan(0);
        done();
      });
    });

    it('should return expected template structure', (done) => {
      service.constraintTemplates.subscribe(templates => {
        expect(templates[0].name).toBeTruthy();
        expect(templates[0].spec).toBeTruthy();
        done();
      });
    });

    it('refreshConstraintTemplates should be callable', () => {
      expect(() => service.refreshConstraintTemplates()).not.toThrow();
    });

    it('createConstraintTemplate should return input template', (done) => {
      const template = fakeConstraintTemplates()[0];
      service.createConstraintTemplate(template).subscribe(result => {
        expect(result).toEqual(template);
        done();
      });
    });

    it('patchConstraintTemplate should return patched template', (done) => {
      const patch = fakeConstraintTemplates()[0];
      service.patchConstraintTemplate('test-template', patch).subscribe(result => {
        expect(result).toEqual(patch);
        done();
      });
    });

    it('deleteConstraintTemplate should return void observable', (done) => {
      service.deleteConstraintTemplate('test-template').subscribe(() => {
        done();
      });
    });
  });

  describe('Constraints', () => {
    it('should return constraints observable', (done) => {
      service.constraints('proj-1', 'cluster-1').subscribe(constraints => {
        expect(Array.isArray(constraints)).toBe(true);
        done();
      });
    });

    it('refreshConstraint should be callable', () => {
      expect(() => service.refreshConstraint()).not.toThrow();
    });

    it('createConstraint should return input constraint', (done) => {
      const constraint = {name: 'test-constraint'};
      service.createConstraint('proj-1', 'cluster-1', constraint as any).subscribe(result => {
        expect(result).toEqual(constraint);
        done();
      });
    });

    it('patchConstraint should return patched constraint', (done) => {
      const patch = {name: 'test-constraint'};
      service.patchConstraint('proj-1', 'cluster-1', 'constraint-1', patch as any).subscribe(result => {
        expect(result).toEqual(patch);
        done();
      });
    });

    it('deleteConstraint should return void observable', (done) => {
      service.deleteConstraint('proj-1', 'cluster-1', 'constraint-1').subscribe(() => {
        done();
      });
    });
  });

  describe('Default Constraints', () => {
    it('should return default constraints observable', (done) => {
      service.defaultConstraints.subscribe(constraints => {
        expect(Array.isArray(constraints)).toBe(true);
        done();
      });
    });

    it('refreshDefaultConstraints should be callable', () => {
      expect(() => service.refreshDefaultConstraints()).not.toThrow();
    });

    it('createDefaultConstraint should return input constraint', (done) => {
      const constraint = {name: 'default-constraint'};
      service.createDefaultConstraint(constraint as any).subscribe(result => {
        expect(result).toEqual(constraint);
        done();
      });
    });

    it('patchDefaultConstraint should return patched constraint', (done) => {
      const patch = {name: 'default-constraint'};
      service.patchDefaultConstraint('constraint-1', patch as any).subscribe(result => {
        expect(result).toEqual(patch);
        done();
      });
    });

    it('deleteDefaultConstraint should return void observable', (done) => {
      service.deleteDefaultConstraint('constraint-1').subscribe(() => {
        done();
      });
    });
  });

  describe('Gatekeeper Config', () => {
    it('should return gatekeeper config observable', (done) => {
      service.gatekeeperConfig('proj-1', 'cluster-1').subscribe(config => {
        expect(config === undefined || config.spec).toBeTruthy();
        done();
      });
    });

    it('refreshGatekeeperConfig should be callable', () => {
      expect(() => service.refreshGatekeeperConfig()).not.toThrow();
    });

    it('createGatekeeperConfig should return input config', (done) => {
      const config = {spec: {}} as any;
      service.createGatekeeperConfig('proj-1', 'cluster-1', config).subscribe(result => {
        expect(result).toEqual(config);
        done();
      });
    });

    it('patchGatekeeperConfig should return patched config', (done) => {
      const patch = {spec: {}} as any;
      service.patchGatekeeperConfig('proj-1', 'cluster-1', patch).subscribe(result => {
        expect(result).toEqual(patch);
        done();
      });
    });

    it('deleteGatekeeperConfig should return void observable', (done) => {
      service.deleteGatekeeperConfig('proj-1', 'cluster-1').subscribe(() => {
        done();
      });
    });
  });

  describe('Violation Page Index', () => {
    it('getViolationPageIndex should return undefined by default', () => {
      const index = service.getViolationPageIndex('proj-1', 'cluster-1', 'constraint-1');
      expect(index).toBeUndefined();
    });

    it('saveViolationPageIndex should be callable', () => {
      expect(() => service.saveViolationPageIndex('proj-1', 'cluster-1', 'constraint-1', 2)).not.toThrow();
    });
  });
});
