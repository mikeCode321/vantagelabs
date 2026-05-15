import { useState } from "react";
import { formatNumberWithCommas, handleNumberInput } from "@/app/visuals/utils";
import { ID } from "@/app/visuals/accounts";

// ─────────────────────────────────────────────
// ASSET
// ─────────────────────────────────────────────

export type HouseAsset = {
  source_type: string; // "asset"
  variant: string; // "house"

  id: ID;
  name: string;

  start_year: number;
  end_year?: number | null;

  asset_value: number;
  annual_appreciation: number; // example: 0.03 = 3% yearly growth

  down_payment?: number | null; // optional; deducted from cash if start_year > 0

  linked_loan_id?: ID | null;
};

export type CarAsset = {
  source_type: string; // "asset"
  variant: string; // "car"

  id: ID;
  name: string;

  start_year: number;
  end_year?: number | null;

  asset_value: number;
  annual_depreciation: number; // example: 0.12 = loses 12% per year

  down_payment?: number | null; // optional; deducted from cash if start_year > 0

  linked_loan_id?: ID | null;
};

export type AssetSource = HouseAsset | CarAsset;

// ASSET FORMS
export function HouseAssetForm({ dispatch, onClose }) {
  const [name, setName] = useState("");
  const [houseValue, setHouseValue] = useState("");
  const [appreciation, setAppreciation] = useState("3");
  const [downPayment, setDownPayment] = useState("");
  const [startYear, setStartYear] = useState("");
  const [endYear, setEndYear] = useState("");

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const houseAsset: HouseAsset = {
      source_type: "asset",
      variant: "house",
      id: crypto.randomUUID(),
      name: name || "House",
      start_year: Number(startYear),
      end_year: endYear === "" ? null : Number(endYear),
      asset_value: Number(houseValue),
      annual_appreciation: Number(appreciation) / 100,
      down_payment: downPayment === "" ? null : Number(downPayment),
    };

    dispatch({
      type: "ADD_ASSET",
      payload: houseAsset,
    });

    if (onClose) onClose();
  };
  const appreciatedValue = Number(houseValue) * (1 - (Number(appreciation) || 0) / 100);
  return (
    <div className="form-panel">
      <div className="form-header">
        <div className="form-header-icon">🏡</div>
        <div>
          <h3 className="form-header-title">Add House</h3>
          <p className="form-header-desc">Track a property asset with appreciation and optional down payment.</p>
        </div>
      </div>

      <form onSubmit={onSubmit}>
        <div className="form-two-col">
          <div className="form-col">
            <p className="form-section-heading">Property Details</p>

            <div className="form-field">
              <label className="form-label">Property Name</label>
              <input value={name} onChange={(e) => setName(e.target.value)} className="form-input" placeholder="Primary Residence, Rental Property" />
            </div>

            <div className="form-field">
              <label className="form-label">House Value</label>
              <div className="form-input-wrap">
                <span className="form-input-prefix">$</span>
                <input value={formatNumberWithCommas(houseValue)} onChange={(e) => handleNumberInput(e, setHouseValue)} className="form-input form-input--prefix-dollar" placeholder="400,000" type="text" inputMode="decimal" required />
              </div>
            </div>

            <div className="form-field">
              <label className="form-label">
                Down Payment <span className="form-label--muted">(optional)</span>
              </label>
              <div className="form-input-wrap">
                <span className="form-input-prefix">$</span>
                <input value={formatNumberWithCommas(downPayment)} onChange={(e) => handleNumberInput(e, setDownPayment)} className="form-input form-input--prefix-dollar" placeholder="80,000" type="text" inputMode="decimal" />
              </div>
            </div>

            <div className="form-field--gap8">
              <div className="form-slider-header">
                <label className="form-label">Annual Appreciation</label>
                <span className="form-slider-value">{Number(appreciation).toFixed(1)}%</span>
              </div>
              <input type="range" min={0} max={15} step={0.1} value={appreciation} onChange={(e) => setAppreciation(e.target.value)} className="form-slider" />
            </div>
          </div>

          <div className="form-col">
            <p className="form-section-heading">Timeline</p>

            <div className="form-year-grid">
              <div className="form-field">
                <label className="form-label">Start yr</label>
                <input value={startYear} onChange={(e) => setStartYear(e.target.value)} className="form-input" placeholder="1" type="number" required />
              </div>

              <div className="form-field">
                <label className="form-label">
                  End yr <span className="form-label--muted">(opt)</span>
                </label>
                <input value={endYear} onChange={(e) => setEndYear(e.target.value)} className="form-input" placeholder="30" type="number" />
              </div>
            </div>

            <div className="preview-card">
              <div className="preview-card__header preview-card__header--mb10">
                <span className="preview-icon">📈</span>
                <span className="preview-card__label">Value After Year 1</span>
              </div>

              <div className="preview-card__amount preview-card__amount--lg">
                $
                {appreciatedValue.toLocaleString(undefined, {
                  maximumFractionDigits: 0,
                })}
              </div>

              <div className="preview-card__sub">
                +{Number(appreciation).toFixed(1)}% appreciation from ${(Number(houseValue) || 0).toLocaleString()}
              </div>
            </div>
          </div>
        </div>

        <div className="form-actions">
          <button type="submit" className="form-btn-primary">
            Save & Continue
          </button>
        </div>
      </form>
    </div>
  );
}

export function CarAssetForm({ dispatch, onClose }) {
  const [name, setName] = useState("");
  const [carValue, setCarValue] = useState("");
  const [depreciation, setDepreciation] = useState("12");
  const [downPayment, setDownPayment] = useState("");
  const [startYear, setStartYear] = useState("");
  const [endYear, setEndYear] = useState("");

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const carAsset: CarAsset = {
      source_type: "asset",
      variant: "car",
      id: crypto.randomUUID(),
      name: name || "Car",
      start_year: Number(startYear),
      end_year: endYear === "" ? null : Number(endYear),
      asset_value: Number(carValue),
      annual_depreciation: Number(depreciation) / 100,
      down_payment: downPayment === "" ? null : Number(downPayment),
    };

    dispatch({
      type: "ADD_ASSET",
      payload: carAsset,
    });

    if (onClose) onClose();
  };

  const depreciatedValue = Number(carValue) * (1 - (Number(depreciation) || 0) / 100);
  return (
    <div className="form-panel">
      <div className="form-header">
        <div className="form-header-icon">🚗</div>
        <div>
          <h3 className="form-header-title">Add Car</h3>
          <p className="form-header-desc">Track a vehicle asset with depreciation and optional down payment.</p>
        </div>
      </div>

      <form onSubmit={onSubmit}>
        <div className="form-two-col">
          {/* LEFT */}
          <div className="form-col">
            <p className="form-section-heading">Vehicle Details</p>

            <div className="form-field">
              <label className="form-label">Car Name</label>
              <input value={name} onChange={(e) => setName(e.target.value)} className="form-input" placeholder="Mazda 3, Tesla Model 3" />
            </div>

            <div className="form-field">
              <label className="form-label">Car Value</label>
              <div className="form-input-wrap">
                <span className="form-input-prefix">$</span>
                <input value={formatNumberWithCommas(carValue)} onChange={(e) => handleNumberInput(e, setCarValue)} className="form-input form-input--prefix-dollar" placeholder="30,000" type="text" inputMode="decimal" required />
              </div>
            </div>

            <div className="form-field">
              <label className="form-label">
                Down Payment <span className="form-label--muted">(optional)</span>
              </label>
              <div className="form-input-wrap">
                <span className="form-input-prefix">$</span>
                <input value={formatNumberWithCommas(downPayment)} onChange={(e) => handleNumberInput(e, setDownPayment)} className="form-input form-input--prefix-dollar" placeholder="5,000" type="text" inputMode="decimal" />
              </div>
            </div>

            <div className="form-field--gap8">
              <div className="form-slider-header">
                <label className="form-label">Annual Depreciation</label>
                <span className="form-slider-value">{Number(depreciation).toFixed(1)}%</span>
              </div>
              <input type="range" min={0} max={40} step={0.1} value={depreciation} onChange={(e) => setDepreciation(e.target.value)} className="form-slider" />
            </div>
          </div>

          {/* RIGHT */}
          <div className="form-col">
            <p className="form-section-heading">Timeline</p>

            <div className="form-year-grid">
              <div className="form-field">
                <label className="form-label">Start yr</label>
                <input value={startYear} onChange={(e) => setStartYear(e.target.value)} className="form-input" placeholder="1" type="number" required />
              </div>

              <div className="form-field">
                <label className="form-label">
                  End yr <span className="form-label--muted">(opt)</span>
                </label>
                <input value={endYear} onChange={(e) => setEndYear(e.target.value)} className="form-input" placeholder="5" type="number" />
              </div>
            </div>

            <div className="preview-card">
              <div className="preview-card__header preview-card__header--mb10">
                <span className="preview-icon">📉</span>
                <span className="preview-card__label">Value After Year 1</span>
              </div>

              <div className="preview-card__amount preview-card__amount--lg">
                $
                {depreciatedValue.toLocaleString(undefined, {
                  maximumFractionDigits: 0,
                })}
              </div>

              <div className="preview-card__sub">
                -{Number(depreciation).toFixed(1)}% depreciation from ${(Number(carValue) || 0).toLocaleString()}
              </div>
            </div>
          </div>
        </div>

        <div className="form-actions">
          <button type="submit" className="form-btn-primary">
            Save & Continue
          </button>
        </div>
      </form>
    </div>
  );
}

/* -------------------- EDIT ASSET FORMS -------------------- */
export function EditHouseAssetForm({ item, state, dispatch, onClose }) {
  const [name, setName] = useState(item.name);
  const [houseValue, setHouseValue] = useState(item.asset_value.toString());
  const [appreciation, setAppreciation] = useState((item.annual_appreciation * 100).toString());
  const [downPayment, setDownPayment] = useState(item.down_payment == null ? "" : item.down_payment.toString());
  const [startYear, setStartYear] = useState(item.start_year.toString());
  const [endYear, setEndYear] = useState(item.end_year?.toString() || "");

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const updatedHouseAsset = {
      ...item,
      source_type: "asset",
      variant: "house",
      name: name || "House",
      start_year: Number(startYear),
      end_year: endYear === "" ? null : Number(endYear),
      asset_value: Number(houseValue),
      annual_appreciation: Number(appreciation) / 100,
      down_payment: downPayment === "" ? null : Number(downPayment),
      //linked_loan_id: item.linked_loan_id ?? null,
    };

    dispatch({
      type: "UPDATE_ASSET",
      payload: updatedHouseAsset,
    });
  };

  const appreciatedValue = Number(houseValue) * (1 + (Number(appreciation) || 0) / 100);

  return (
    <div className="form-panel">
      <div className="form-header">
        <div className="form-header-icon">🏡</div>
        <div>
          <h3 className="form-header-title">Edit House</h3>
          <p className="form-header-desc">Update property value, appreciation rate, and timeline.</p>
        </div>
      </div>

      <form onSubmit={onSubmit}>
        <div className="form-two-col">
          <div className="form-col">
            <p className="form-section-heading">Property Details</p>

            <div className="form-field">
              <label className="form-label">Property Name</label>
              <input value={name} onChange={(e) => setName(e.target.value)} className="form-input" placeholder="Primary Residence" />
            </div>

            <div className="form-field">
              <label className="form-label">House Value</label>
              <div className="form-input-wrap">
                <span className="form-input-prefix">$</span>
                <input value={formatNumberWithCommas(houseValue)} onChange={(e) => handleNumberInput(e, setHouseValue)} className="form-input form-input--prefix-dollar" placeholder="400,000" type="text" inputMode="decimal" />
              </div>
            </div>

            <div className="form-field">
              <label className="form-label">
                Down Payment <span className="form-label--muted">(optional)</span>
              </label>
              <div className="form-input-wrap">
                <span className="form-input-prefix">$</span>
                <input value={formatNumberWithCommas(downPayment)} onChange={(e) => handleNumberInput(e, setDownPayment)} className="form-input form-input--prefix-dollar" placeholder="80,000" type="text" inputMode="decimal" />
              </div>
            </div>

            <div className="form-field--gap8">
              <div className="form-slider-header">
                <label className="form-label">Annual Appreciation</label>
                <span className="form-slider-value">{Number(appreciation).toFixed(1)}%</span>
              </div>
              <input type="range" min={0} max={15} step={0.1} value={appreciation} onChange={(e) => setAppreciation(e.target.value)} className="form-slider" />
            </div>
          </div>

          <div className="form-col">
            <p className="form-section-heading">Timeline</p>

            <div className="form-year-grid">
              <div className="form-field">
                <label className="form-label">Start yr</label>
                <input value={startYear} onChange={(e) => setStartYear(e.target.value)} className="form-input" placeholder="1" type="number" />
              </div>

              <div className="form-field">
                <label className="form-label">
                  End yr <span className="form-label--muted">(opt)</span>
                </label>
                <input value={endYear} onChange={(e) => setEndYear(e.target.value)} className="form-input" placeholder="30" type="number" />
              </div>
            </div>

            <div className="preview-card">
              <div className="preview-card__header preview-card__header--mb10">
                <span className="preview-icon">📈</span>
                <span className="preview-card__label">Value After Year 1</span>
              </div>

              <div className="preview-card__amount preview-card__amount--lg">
                $
                {appreciatedValue.toLocaleString(undefined, {
                  maximumFractionDigits: 0,
                })}
              </div>

              <div className="preview-card__sub">
                +{Number(appreciation).toFixed(1)}% appreciation from ${(Number(houseValue) || 0).toLocaleString()}
              </div>
            </div>
          </div>
        </div>

        <div className="form-actions">
          <button type="button" onClick={onClose} className="form-btn-secondary">
            Cancel
          </button>
          <button type="submit" className="form-btn-primary">
            Save & Continue
          </button>
        </div>
      </form>
    </div>
  );
}

export function EditCarAssetForm({ state, item, dispatch, onClose }) {
  const [name, setName] = useState(item.name);
  const [carValue, setCarValue] = useState(item.asset_value.toString());
  const [depreciation, setDepreciation] = useState((item.annual_depreciation * 100).toString());
  const [downPayment, setDownPayment] = useState(item.down_payment == null ? "" : item.down_payment.toString());
  const [startYear, setStartYear] = useState(item.start_year.toString());
  const [endYear, setEndYear] = useState(item.end_year?.toString() || "");

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const updatedCarAsset = {
      ...item,
      source_type: "asset",
      variant: "car",
      name: name || "Car",
      start_year: Number(startYear),
      end_year: endYear === "" ? null : Number(endYear),
      asset_value: Number(carValue),
      annual_depreciation: Number(depreciation) / 100,
      down_payment: downPayment === "" ? null : Number(downPayment),
      //linked_loan_id: item.linked_loan_id ?? null,
    };

    dispatch({
      type: "UPDATE_ASSET",
      payload: updatedCarAsset,
    });
  };

  const depreciatedValue = Number(carValue) * (1 - (Number(depreciation) || 0) / 100);

  return (
    <div className="form-panel">
      {/* Header */}
      <div className="form-header">
        <div className="form-header-icon">🚗</div>
        <div>
          <h3 className="form-header-title">Edit Car</h3>
          <p className="form-header-desc">Update vehicle value, depreciation rate, and timeline.</p>
        </div>
      </div>

      <form onSubmit={onSubmit}>
        <div className="form-two-col">
          {/* ── LEFT ── */}
          <div className="form-col">
            <p className="form-section-heading">Vehicle Details</p>

            <div className="form-field">
              <label className="form-label">Car Name</label>
              <input value={name} onChange={(e) => setName(e.target.value)} className="form-input" placeholder="Toyota Camry" />
            </div>

            <div className="form-field">
              <label className="form-label">Car Value</label>
              <div className="form-input-wrap">
                <span className="form-input-prefix">$</span>
                <input value={formatNumberWithCommas(carValue)} onChange={(e) => handleNumberInput(e, setCarValue)} className="form-input form-input--prefix-dollar" placeholder="30,000" type="text" inputMode="decimal" />
              </div>
            </div>

            <div className="form-field">
              <label className="form-label">
                Down Payment <span className="form-label--muted">(optional)</span>
              </label>
              <div className="form-input-wrap">
                <span className="form-input-prefix">$</span>
                <input value={formatNumberWithCommas(downPayment)} onChange={(e) => handleNumberInput(e, setDownPayment)} className="form-input form-input--prefix-dollar" placeholder="5,000" type="text" inputMode="decimal" />
              </div>
            </div>

            <div className="form-field--gap8">
              <div className="form-slider-header">
                <label className="form-label">Annual Depreciation</label>
                <span className="form-slider-value">{Number(depreciation).toFixed(1)}%</span>
              </div>
              <input type="range" min={0} max={30} step={0.5} value={depreciation} onChange={(e) => setDepreciation(e.target.value)} className="form-slider" />
            </div>
          </div>

          {/* ── RIGHT ── */}
          <div className="form-col">
            <p className="form-section-heading">Timeline</p>

            <div className="form-year-grid">
              <div className="form-field">
                <label className="form-label">Start yr</label>
                <input value={startYear} onChange={(e) => setStartYear(e.target.value)} className="form-input" placeholder="1" type="number" />
              </div>
              <div className="form-field">
                <label className="form-label">
                  End yr <span className="form-label--muted">(opt)</span>
                </label>
                <input value={endYear} onChange={(e) => setEndYear(e.target.value)} className="form-input" placeholder="10" type="number" />
              </div>
            </div>

            {/* Value Preview */}
            <div className="preview-card">
              <div className="preview-card__header preview-card__header--mb10">
                <span className="preview-icon">📉</span>
                <span className="preview-card__label">Value After Year 1</span>
              </div>

              <div className="preview-card__amount preview-card__amount--lg">
                $
                {depreciatedValue.toLocaleString(undefined, {
                  maximumFractionDigits: 0,
                })}
              </div>

              <div className="preview-card__sub">
                -{Number(depreciation).toFixed(1)}% depreciation from ${(Number(carValue) || 0).toLocaleString()}
              </div>
            </div>
          </div>
        </div>

        <div className="form-footer">
          <button type="button" onClick={onClose} className="form-btn-cancel">
            Cancel
          </button>
          <button type="submit" className="form-btn-submit">
            Save Car
          </button>
        </div>
      </form>
    </div>
  );
}
