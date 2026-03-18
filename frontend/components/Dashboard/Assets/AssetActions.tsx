"use client";

import { useState } from "react";
import type { Asset, NewAsset, AssetType } from "./types";
import { DEFAULT_GROWTH_RATES } from "./types";

type AssetActionsProps = {
  onAddAsset: (asset: NewAsset) => void;
};

type AssetFormState = {
  name: string;
  type: AssetType;
  value: string;
  monthlyExpense: string;
  downPayment: string;
};

const INITIAL_FORM: AssetFormState = {
  name: "",
  type: "house",
  value: "",
  monthlyExpense: "",
  downPayment: "",
};

export default function AssetActions({ onAddAsset }: AssetActionsProps) {
  const [form, setForm] = useState<AssetFormState>(INITIAL_FORM);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!form.name.trim()) return;

    onAddAsset({
      name: form.name.trim(),
      type: form.type,
      value: Number(form.value) || 0,
      monthlyExpense: Number(form.monthlyExpense) || 0,
      downPayment: Number(form.downPayment) || 0,
      compound: DEFAULT_GROWTH_RATES[form.type],
      year: 0,
    });

    setForm(INITIAL_FORM);
  };

  return (
    <section className="asset-form-wrap">
      <form onSubmit={handleSubmit}>
        <div className="asset-form-grid">
          <div className="asset-field">
            <label className="asset-label">Asset Name</label>
            <input
              className="asset-input"
              name="name"
              value={form.name}
              onChange={handleChange}
              placeholder="Rental House"
            />
          </div>

          <div className="asset-field">
            <label className="asset-label">Type</label>
            <select
              className="asset-select"
              name="type"
              value={form.type}
              onChange={handleChange}
            >
              <option value="house">House</option>
              <option value="gold">Gold</option>
              <option value="car">Car</option>
            </select>
          </div>

          <div className="asset-field">
            <label className="asset-label">Value</label>
            <input
              className="asset-input"
              name="value"
              type="number"
              value={form.value}
              onChange={handleChange}
              placeholder="250000"
            />
          </div>

          <div className="asset-field">
            <label className="asset-label">Monthly Expense</label>
            <input
              className="asset-input"
              name="monthlyExpense"
              type="number"
              value={form.monthlyExpense}
              onChange={handleChange}
              placeholder="1800"
            />
          </div>

          <div className="asset-field">
            <label className="asset-label">Down Payment</label>
            <input
              className="asset-input"
              name="downPayment"
              type="number"
              value={form.downPayment}
              onChange={handleChange}
              placeholder="50000"
            />
          </div>
        </div>

        <div className="asset-form-actions">
          <button type="submit" className="asset-button">
            Save Asset
          </button>
        </div>
      </form>
    </section>
  );
}