import { TestBed } from '@angular/core/testing';
import { DEFAULT_SORT } from '../../data/customer.model';
import { CustomerToolbar } from './customer-toolbar';

describe('CustomerToolbar', () => {
  function clearButtonShownFor(query: string): boolean {
    TestBed.configureTestingModule({ imports: [CustomerToolbar] });
    const fixture = TestBed.createComponent(CustomerToolbar);
    fixture.componentRef.setInput('query', query);
    fixture.componentRef.setInput('sort', DEFAULT_SORT);
    fixture.componentRef.setInput('view', 'table');
    fixture.detectChanges();
    const element: HTMLElement = fixture.nativeElement;
    return element.querySelector('button[aria-label="Clear search"]') !== null;
  }

  it('shows the clear button when the search has text', () => {
    expect(clearButtonShownFor('ann')).toBe(true);
  });

  it('hides the clear button when the search is empty or only spaces', () => {
    expect(clearButtonShownFor('')).toBe(false);
    TestBed.resetTestingModule();
    expect(clearButtonShownFor('   ')).toBe(false);
  });
});
