// src/app/features/assets/components/audit-log/audit-log.component.spec.ts
import { TestBed, ComponentFixture } from '@angular/core/testing';
import { AuditLogComponent, LogEntry } from './audit-log.component';

describe('AuditLogComponent', () => {
  let fixture: ComponentFixture<AuditLogComponent>;
  let component: AuditLogComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AuditLogComponent],
    }).compileComponents();
    fixture = TestBed.createComponent(AuditLogComponent);
    component = fixture.componentInstance;
  });

  it('renders entries', () => {
    const entries: LogEntry[] = [
      { id: 1, time: '10:00:00', action: 'Load', detail: 'Loaded 3 assets' },
    ];
    component.entries = entries;
    fixture.detectChanges();
    const el: HTMLElement = fixture.nativeElement;
    expect(el.textContent).toContain('Load');
    expect(el.textContent).toContain('Loaded 3 assets');
  });

  it('emits close when × button is clicked', () => {
    component.entries = [];
    fixture.detectChanges();
    const closeSpy = vi.fn();
    component.close.subscribe(closeSpy);
    const buttons: NodeListOf<HTMLButtonElement> = fixture.nativeElement.querySelectorAll('button');
    buttons[buttons.length - 1].click();
    expect(closeSpy).toHaveBeenCalledTimes(1);
  });

  it('emits clear when Clear button is clicked', () => {
    component.entries = [];
    fixture.detectChanges();
    const clearSpy = vi.fn();
    component.clear.subscribe(clearSpy);
    const clearBtn: HTMLButtonElement = fixture.nativeElement.querySelector('button');
    clearBtn.click();
    expect(clearSpy).toHaveBeenCalledTimes(1);
  });

  it('shows empty message when entries array is empty', () => {
    component.entries = [];
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('No log entries yet');
  });
});
