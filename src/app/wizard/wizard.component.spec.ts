/* tslint:disable:no-unused-variable */
import { async, ComponentFixture, TestBed } from "@angular/core/testing";

import { WizardComponent } from "./wizard.component";
import {FormBuilder, ReactiveFormsModule, FormsModule} from "@angular/forms";
import {ClusterNameGenerator} from "../util/name-generator.service";
import {ApiService} from "../api/api.service";
import {HttpModule} from "@angular/http";
import {Auth} from "../auth/auth.service";
import {RouterTestingModule} from "@angular/router/testing";
import {GlobalState} from "../global.state";

describe("WizardComponent", () => {
  let component: WizardComponent;
  let fixture: ComponentFixture<WizardComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      imports: [
        FormsModule,
        ReactiveFormsModule,
        HttpModule,
        RouterTestingModule
      ],
      declarations: [
        WizardComponent
      ],
      providers: [
        Auth,
        ApiService,
        ClusterNameGenerator,
        FormBuilder,
        GlobalState
      ],
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(WizardComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });
});
