import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ProcedurePicker } from './ProcedurePicker';
import type { ProcedureType } from '../../types';

const mockProcedures: ProcedureType[] = [
  { id: 'gs_lap_chole', name: 'Laparoscopic cholecystectomy', category: 'Hepatobiliary', specialty: 'General Surgery', isCustom: false },
  { id: 'gs_appendicectomy', name: 'Appendicectomy', category: 'Colorectal', specialty: 'General Surgery', isCustom: false },
  { id: 'ortho_thr', name: 'Total hip replacement', category: 'Arthroplasty', specialty: 'Orthopaedics', isCustom: false },
];

describe('ProcedurePicker', () => {
  const onChange = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders placeholder when nothing selected', () => {
    render(<ProcedurePicker selected={[]} onChange={onChange} procedures={mockProcedures} />);
    expect(screen.getByText('Select procedures...')).toBeInTheDocument();
  });

  it('renders selected procedure chips', () => {
    render(<ProcedurePicker selected={['gs_lap_chole']} onChange={onChange} procedures={mockProcedures} />);
    expect(screen.getByText('Laparoscopic cholecystectomy')).toBeInTheDocument();
  });

  it('opens dropdown on click', () => {
    render(<ProcedurePicker selected={[]} onChange={onChange} procedures={mockProcedures} />);
    fireEvent.click(screen.getByRole('button', { expanded: false }));
    expect(screen.getByLabelText('Procedures')).toBeInTheDocument();
    expect(screen.getByLabelText('Search procedures')).toBeInTheDocument();
  });

  it('shows all procedures grouped by specialty', () => {
    render(<ProcedurePicker selected={[]} onChange={onChange} procedures={mockProcedures} />);
    fireEvent.click(screen.getByRole('button', { expanded: false }));

    expect(screen.getByText('General Surgery')).toBeInTheDocument();
    expect(screen.getByText('Orthopaedics')).toBeInTheDocument();
  });

  it('filters procedures by search', () => {
    render(<ProcedurePicker selected={[]} onChange={onChange} procedures={mockProcedures} />);
    fireEvent.click(screen.getByRole('button', { expanded: false }));

    fireEvent.change(screen.getByLabelText('Search procedures'), { target: { value: 'hip' } });
    expect(screen.getByText('Total hip replacement')).toBeInTheDocument();
    expect(screen.queryByText('Appendicectomy')).not.toBeInTheDocument();
  });

  it('calls onChange when selecting a procedure', () => {
    render(<ProcedurePicker selected={[]} onChange={onChange} procedures={mockProcedures} />);
    fireEvent.click(screen.getByRole('button', { expanded: false }));
    fireEvent.click(screen.getByRole('option', { name: /Appendicectomy/ }));
    expect(onChange).toHaveBeenCalledWith(['gs_appendicectomy']);
  });

  it('calls onChange to deselect a procedure', () => {
    render(<ProcedurePicker selected={['gs_lap_chole', 'gs_appendicectomy']} onChange={onChange} procedures={mockProcedures} />);
    fireEvent.click(screen.getByRole('button', { expanded: false }));
    fireEvent.click(screen.getByRole('option', { name: /Laparoscopic cholecystectomy/ }));
    expect(onChange).toHaveBeenCalledWith(['gs_appendicectomy']);
  });

  it('removes chip via X button', () => {
    render(<ProcedurePicker selected={['gs_lap_chole']} onChange={onChange} procedures={mockProcedures} />);
    fireEvent.click(screen.getByLabelText('Remove Laparoscopic cholecystectomy'));
    expect(onChange).toHaveBeenCalledWith([]);
  });

  it('shows no results message for non-matching search', () => {
    render(<ProcedurePicker selected={[]} onChange={onChange} procedures={mockProcedures} />);
    fireEvent.click(screen.getByRole('button', { expanded: false }));
    fireEvent.change(screen.getByLabelText('Search procedures'), { target: { value: 'zzzznonexistent' } });
    expect(screen.getByText('No procedures found')).toBeInTheDocument();
  });

  it('closes on Escape', () => {
    render(<ProcedurePicker selected={[]} onChange={onChange} procedures={mockProcedures} />);
    fireEvent.click(screen.getByRole('button', { expanded: false }));
    expect(screen.getByLabelText('Procedures')).toBeInTheDocument();

    fireEvent.keyDown(document, { key: 'Escape' });
    expect(screen.queryByLabelText('Procedures')).not.toBeInTheDocument();
  });
});
