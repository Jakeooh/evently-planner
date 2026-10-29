import { describe, expect, it } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import App from '../src/App';

describe('Evently interface',()=>{
  it('moves through onboarding validation',()=>{render(<App/>);fireEvent.click(screen.getByRole('button',{name:/keep going/i}));fireEvent.click(screen.getByRole('button',{name:/keep going/i}));expect(screen.getByText(/pick today/i)).toBeInTheDocument();});
  it('opens the sample plan and exposes its tabs',async()=>{render(<App/>);fireEvent.click(screen.getByRole('button',{name:/a little wedding/i}));expect(await screen.findByRole('tablist',{name:/plan sections/i})).toBeInTheDocument();expect(screen.getByRole('tab',{name:/budget/i})).toBeInTheDocument();});
  it('keeps venue vendor estimates synced to budget edits',async()=>{render(<App/>);fireEvent.click(screen.getByRole('button',{name:/a little wedding/i}));await screen.findByRole('tablist',{name:/plan sections/i});fireEvent.click(screen.getByRole('tab',{name:/budget/i}));fireEvent.change(screen.getByRole('spinbutton',{name:/venue budget/i}),{target:{value:'5000'}});fireEvent.click(screen.getByRole('tab',{name:/vendors/i}));expect(await screen.findByText('5,000')).toBeInTheDocument();});
  it('renders chat content as plain text',async()=>{render(<App/>);fireEvent.click(screen.getByRole('button',{name:/a little wedding/i}));await screen.findByRole('tablist',{name:/plan sections/i});fireEvent.click(await screen.findByRole('button',{name:/ask evently/i}));const field=screen.getByRole('textbox',{name:/ask about your event plan/i});fireEvent.change(field,{target:{value:'<script>alert(1)</script>'}});fireEvent.click(screen.getByRole('button',{name:/send message/i}));expect(await screen.findByText('<script>alert(1)</script>')).toBeInTheDocument();});
});
