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

import {ComponentFixture, fakeAsync, TestBed, tick, waitForAsync} from '@angular/core/testing';
import {MachineDeploymentService} from '@core/services/machine-deployment';
import {ClipboardService} from 'ngx-clipboard';
import {of} from 'rxjs';
import {CopyJoiningScriptButtonComponent} from './component';

describe('CopyJoiningScriptButtonComponent', () => {
  let fixture: ComponentFixture<CopyJoiningScriptButtonComponent>;
  let component: CopyJoiningScriptButtonComponent;
  let machineDeploymentService: MachineDeploymentService;
  let clipboardService: ClipboardService;

  beforeEach(waitForAsync(() => {
    const machineDeploymentServiceMock = {
      getJoiningScript: jest.fn(),
    };
    const clipboardServiceMock = {
      copy: jest.fn(),
    };

    TestBed.configureTestingModule({
      declarations: [CopyJoiningScriptButtonComponent],
      providers: [
        {provide: MachineDeploymentService, useValue: machineDeploymentServiceMock},
        {provide: ClipboardService, useValue: clipboardServiceMock},
      ],
      teardown: {destroyAfterEach: false},
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(CopyJoiningScriptButtonComponent);
    component = fixture.componentInstance;
    machineDeploymentService = TestBed.inject(MachineDeploymentService);
    clipboardService = TestBed.inject(ClipboardService);
  });

  it('should create the copy joining script button component', () => {
    expect(component).toBeTruthy();
  });

  it('should accept machineDeploymentID as input', () => {
    component.machineDeploymentID = 'test-md-id';
    expect(component.machineDeploymentID).toBe('test-md-id');
  });

  it('should accept clusterName as input', () => {
    component.clusterName = 'test-cluster';
    expect(component.clusterName).toBe('test-cluster');
  });

  it('should accept projectID as input', () => {
    component.projectID = 'test-project-id';
    expect(component.projectID).toBe('test-project-id');
  });

  it('should initialize isLoading as false', () => {
    expect(component.isLoading).toBeFalsy();
  });

  it('should initialize isCopied as false', () => {
    expect(component.isCopied).toBeFalsy();
  });

  it('should set isLoading to true when copyJoiningScript is called', fakeAsync(() => {
    const baseEncodedScript = btoa('#!/bin/bash\necho "joining script"');
    jest.spyOn(machineDeploymentService, 'getJoiningScript').mockReturnValue(of(baseEncodedScript));

    component.machineDeploymentID = 'test-md-id';
    component.clusterName = 'test-cluster';
    component.projectID = 'test-project-id';

    component.copyJoiningScript();
    expect(component.isLoading).toBe(true);

    tick();
  }));

  it('should set isLoading to false after service responds', fakeAsync(() => {
    const baseEncodedScript = btoa('#!/bin/bash\necho "joining script"');
    jest.spyOn(machineDeploymentService, 'getJoiningScript').mockReturnValue(of(baseEncodedScript));

    component.machineDeploymentID = 'test-md-id';
    component.clusterName = 'test-cluster';
    component.projectID = 'test-project-id';

    component.copyJoiningScript();
    tick();

    expect(component.isLoading).toBe(false);
  }));

  it('should call getJoiningScript with correct parameters', fakeAsync(() => {
    const baseEncodedScript = btoa('#!/bin/bash\necho "joining script"');
    const spy = jest.spyOn(machineDeploymentService, 'getJoiningScript').mockReturnValue(of(baseEncodedScript));

    component.machineDeploymentID = 'test-md-id';
    component.clusterName = 'test-cluster';
    component.projectID = 'test-project-id';

    component.copyJoiningScript();
    tick();

    expect(spy).toHaveBeenCalledWith('test-md-id', 'test-cluster', 'test-project-id');
  }));

  it('should decode base64 script and copy to clipboard', fakeAsync(() => {
    const originalScript = '#!/bin/bash\necho "joining script"';
    const baseEncodedScript = btoa(originalScript);
    jest.spyOn(machineDeploymentService, 'getJoiningScript').mockReturnValue(of(baseEncodedScript));
    const copySpy = jest.spyOn(clipboardService, 'copy');

    component.machineDeploymentID = 'test-md-id';
    component.clusterName = 'test-cluster';
    component.projectID = 'test-project-id';

    component.copyJoiningScript();
    tick();

    expect(copySpy).toHaveBeenCalledWith(originalScript);
  }));

  it('should set isCopied to true when copy is successful', fakeAsync(() => {
    const baseEncodedScript = btoa('#!/bin/bash\necho "joining script"');
    jest.spyOn(machineDeploymentService, 'getJoiningScript').mockReturnValue(of(baseEncodedScript));
    jest.spyOn(clipboardService, 'copy');

    component.machineDeploymentID = 'test-md-id';
    component.clusterName = 'test-cluster';
    component.projectID = 'test-project-id';

    component.copyJoiningScript();
    tick();

    expect(component.isCopied).toBe(true);
  }));

  it('should set isCopied back to false after 2 seconds', fakeAsync(() => {
    const baseEncodedScript = btoa('#!/bin/bash\necho "joining script"');
    jest.spyOn(machineDeploymentService, 'getJoiningScript').mockReturnValue(of(baseEncodedScript));
    jest.spyOn(clipboardService, 'copy');

    component.machineDeploymentID = 'test-md-id';
    component.clusterName = 'test-cluster';
    component.projectID = 'test-project-id';

    component.copyJoiningScript();
    tick();

    expect(component.isCopied).toBe(true);

    tick(2000);

    expect(component.isCopied).toBe(false);
  }));

  it('should handle invalid base64 encoding gracefully', fakeAsync(() => {
    const invalidBase64 = 'not-a-valid-base64!!!';
    jest.spyOn(machineDeploymentService, 'getJoiningScript').mockReturnValue(of(invalidBase64));
    const copySpy = jest.spyOn(clipboardService, 'copy');

    component.machineDeploymentID = 'test-md-id';
    component.clusterName = 'test-cluster';
    component.projectID = 'test-project-id';

    component.copyJoiningScript();
    tick();

    // Should not call copy due to exception in atob
    expect(copySpy).not.toHaveBeenCalled();
    expect(component.isLoading).toBe(false);
  }));

  it('should still set isLoading to false even if base64 decode fails', fakeAsync(() => {
    const invalidBase64 = 'not-a-valid-base64!!!';
    jest.spyOn(machineDeploymentService, 'getJoiningScript').mockReturnValue(of(invalidBase64));

    component.machineDeploymentID = 'test-md-id';
    component.clusterName = 'test-cluster';
    component.projectID = 'test-project-id';

    component.copyJoiningScript();
    tick();

    expect(component.isLoading).toBe(false);
  }));

  it('should not set isCopied if base64 decode fails', fakeAsync(() => {
    const invalidBase64 = 'not-a-valid-base64!!!';
    jest.spyOn(machineDeploymentService, 'getJoiningScript').mockReturnValue(of(invalidBase64));

    component.machineDeploymentID = 'test-md-id';
    component.clusterName = 'test-cluster';
    component.projectID = 'test-project-id';

    component.copyJoiningScript();
    tick();

    expect(component.isCopied).toBe(false);
  }));

  it('should handle script with special characters', fakeAsync(() => {
    const scriptWithSpecialChars = '#!/bin/bash\necho "Special chars: @#$%^&*()"';
    const baseEncodedScript = btoa(scriptWithSpecialChars);
    jest.spyOn(machineDeploymentService, 'getJoiningScript').mockReturnValue(of(baseEncodedScript));
    const copySpy = jest.spyOn(clipboardService, 'copy');

    component.machineDeploymentID = 'test-md-id';
    component.clusterName = 'test-cluster';
    component.projectID = 'test-project-id';

    component.copyJoiningScript();
    tick();

    expect(copySpy).toHaveBeenCalledWith(scriptWithSpecialChars);
  }));

  it('should handle large base64 encoded scripts', fakeAsync(() => {
    const largeScript = 'echo "test";\n'.repeat(1000);
    const baseEncodedScript = btoa(largeScript);
    jest.spyOn(machineDeploymentService, 'getJoiningScript').mockReturnValue(of(baseEncodedScript));
    const copySpy = jest.spyOn(clipboardService, 'copy');

    component.machineDeploymentID = 'test-md-id';
    component.clusterName = 'test-cluster';
    component.projectID = 'test-project-id';

    component.copyJoiningScript();
    tick();

    expect(copySpy).toHaveBeenCalledWith(largeScript);
  }));

  it('should use take(1) operator to unsubscribe after first emission', fakeAsync(() => {
    const baseEncodedScript = btoa('#!/bin/bash\necho "joining script"');
    const getJoiningScriptSpy = jest.spyOn(machineDeploymentService, 'getJoiningScript').mockReturnValue(of(baseEncodedScript));

    component.machineDeploymentID = 'test-md-id';
    component.clusterName = 'test-cluster';
    component.projectID = 'test-project-id';

    component.copyJoiningScript();
    tick();

    // take(1) ensures subscription is cleaned up after first emission
    expect(getJoiningScriptSpy).toHaveBeenCalledTimes(1);
  }));

  it('should handle empty script response', fakeAsync(() => {
    const emptyScript = btoa('');
    jest.spyOn(machineDeploymentService, 'getJoiningScript').mockReturnValue(of(emptyScript));
    const copySpy = jest.spyOn(clipboardService, 'copy');

    component.machineDeploymentID = 'test-md-id';
    component.clusterName = 'test-cluster';
    component.projectID = 'test-project-id';

    component.copyJoiningScript();
    tick();

    expect(copySpy).toHaveBeenCalledWith('');
  }));

  it('should maintain isCopied state during timeout duration', fakeAsync(() => {
    const baseEncodedScript = btoa('#!/bin/bash\necho "joining script"');
    jest.spyOn(machineDeploymentService, 'getJoiningScript').mockReturnValue(of(baseEncodedScript));

    component.machineDeploymentID = 'test-md-id';
    component.clusterName = 'test-cluster';
    component.projectID = 'test-project-id';

    component.copyJoiningScript();
    tick();

    expect(component.isCopied).toBe(true);

    // Mid-timeout, should still be true
    tick(1000);
    expect(component.isCopied).toBe(true);

    // After timeout, should be false
    tick(1000);
    expect(component.isCopied).toBe(false);
  }));
});
