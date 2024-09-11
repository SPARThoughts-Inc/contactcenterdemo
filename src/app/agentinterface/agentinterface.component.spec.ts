import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AgentinterfaceComponent } from './agentinterface.component';

describe('AgentinterfaceComponent', () => {
  let component: AgentinterfaceComponent;
  let fixture: ComponentFixture<AgentinterfaceComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AgentinterfaceComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AgentinterfaceComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
