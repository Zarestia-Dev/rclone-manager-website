import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { NotFound } from './not-found';

describe('NotFound', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [NotFound],
      providers: [provideRouter([])],
    }).compileComponents();
  });

  it('should create', () => {
    const fixture = TestBed.createComponent(NotFound);
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('should render the 404 code', () => {
    const fixture = TestBed.createComponent(NotFound);
    fixture.detectChanges();
    const host = fixture.nativeElement as HTMLElement;
    expect(host.querySelector('.not-found__code')?.textContent).toContain('404');
  });

  it('should render a back-to-home CTA', () => {
    const fixture = TestBed.createComponent(NotFound);
    fixture.detectChanges();
    const host = fixture.nativeElement as HTMLElement;
    const cta = host.querySelector('a[routerLink="/"]');
    expect(cta).toBeTruthy();
  });
});
