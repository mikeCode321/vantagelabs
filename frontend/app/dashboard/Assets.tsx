import './styles/Forms.css'

import { useState } from "react";
import { formatNumberWithCommas, handleNumberInput } from "@/app/dashboard/utils";
import { ID } from "@/app/dashboard/Accounts";
import { TimelineAgeFields, getValidatedTimelinePayload, } from "@/app/dashboard/TimelineAgeFields";
import { Link, HousePlus, ChartBarIncreasing, Car, ChartBarDecreasing } from 'lucide-react';
import FormSlider from "@/app/dashboard/components/FormSlider";
import FormHeader from '@/app/dashboard/components/FormHeader';
import LinkCard from '@/app/dashboard/components/LinkCard';
import FormDollarInput from '@/app/dashboard/components/FormDollarInput';
import FormSubmitButton from '@/app/dashboard/components/FormSubmitButton';

// ─────────────────────────────────────────────
// ASSET
// ─────────────────────────────────────────────

export type HouseAsset = {
  source_type: string; // "asset"
  variant: string; // "house"

  id: ID;
  name: string;

  start_age: number;
  end_age?: number | null;

  asset_value: number;
  annual_appreciation: number; // example: 0.03 = 3% yearly growth

  down_payment?: number | null; // optional; deducted from cash if start_age > 0

  linked_loan_id?: ID | null;
};

export type CarAsset = {
  source_type: string; // "asset"
  variant: string; // "car"

  id: ID;
  name: string;

  start_age: number;
  end_age?: number | null;

  asset_value: number;
  annual_depreciation: number; // example: 0.12 = loses 12% per year

  down_payment?: number | null; // optional; deducted from cash if start_age > 0

  linked_loan_id?: ID | null;
};

export type AssetSource = HouseAsset | CarAsset;

// ASSET FORMS
export function HouseAssetForm({ dispatch, state, onClose, onToast }) {
  const [name, setName] = useState("");
  const [houseValue, setHouseValue] = useState("");
  const [appreciation, setAppreciation] = useState("3");
  const [downPayment, setDownPayment] = useState("");
  const [startAge, setStartAge] = useState("");
  const [endAge, setEndAge] = useState("");

  const [linkedLoanId, setLinkedLoanId] = useState("");
  const [linkError, setLinkError] = useState("");
  
  const availableHouseLoans = state?.expenses?.house_loan || [];

  const availableHouses = state?.assets?.house || [];

  const getHouseLinkedToLoan = (loanId: string) => {
    return availableHouses.find((house) => house.linked_loan_id === loanId);
  };

  const isLoanLinkedToAnotherHouse = (loan) => {
    const houseLinkedFromAssetSide = getHouseLinkedToLoan(loan.id);

    return Boolean(
      loan.linked_asset_id || houseLinkedFromAssetSide
    );
  };
  
  const linkedLoan = linkedLoanId
    ? availableHouseLoans.find((loan) => loan.id === linkedLoanId)
    : null;
  
  const handleHouseLoanSelect = (loanId: string) => {
    setLinkError("");
  
    if (!loanId) {
      setLinkedLoanId("");
      return;
    }
  
    const selectedLoan = availableHouseLoans.find((loan) => loan.id === loanId);
  
    if (selectedLoan && isLoanLinkedToAnotherHouse(selectedLoan)) {
      setLinkError("This home loan is already linked to another house.");
      setLinkedLoanId("");
      return;
    }
  
    setLinkedLoanId(loanId);
  
    if (selectedLoan) {
      setName(selectedLoan.name.replace(" Loan", "") || "House");
      setStartAge(selectedLoan.start_age.toString());
  
      if (selectedLoan.original_principal) {
        setHouseValue(
          (
            Number(selectedLoan.original_principal || 0) +
            Number(downPayment || 0)
          ).toString()
        );
      }
    }
  };
  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const timeline = getValidatedTimelinePayload(state, startAge, endAge);

    if (timeline.invalid) {
        return;
    }
  
    if (linkError) return;
  
    const assetId = crypto.randomUUID();
  
    const houseAsset: HouseAsset = {
      source_type: "asset",
      variant: "house",
      id: assetId,
      name: name || "House",
      start_age: timeline.start,
      end_age: timeline.end,
      asset_value: Number(houseValue),
      annual_appreciation: Number(appreciation) / 100,
      down_payment: downPayment === "" ? null : Number(downPayment),
      linked_loan_id: linkedLoanId || null,
    };
  
    if (linkedLoanId) {
      const selectedLoan = availableHouseLoans.find(
        (loan) => loan.id === linkedLoanId
      );
  
      if (selectedLoan) {
        dispatch({
          type: "UPDATE_EXPENSE",
          payload: {
            ...selectedLoan,
            linked_asset_id: assetId,
          },
        });
      }
    }
  
    dispatch({
      type: "ADD_ASSET",
      payload: houseAsset,
    });

    onToast(name, "added");

    if (onClose) onClose();
  };

  const appreciatedValue = Number(houseValue) * (1 + (Number(appreciation) || 0) / 100);
  return (
    <div className="form-panel">
      <FormHeader icon={<HousePlus/>} title={"Add House"} desc={"Track a property asset with appreciation and optional down payment."} />

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
              <FormDollarInput value={houseValue} onChange={setHouseValue} placeholder="400,000" required />
            </div>

            <div className="form-field">
              <label className="form-label">Down Payment <span className="form-label-muted">(optional)</span></label>
              <FormDollarInput value={downPayment} onChange={setDownPayment} placeholder="80,000" />
            </div>

            <FormSlider label="Annual Appreciation" value={appreciation} onChange={setAppreciation} min={0} max={15} step={0.1} />
          </div>

          <div className="form-col">
            <p className="form-section-heading">Timeline</p>

            <TimelineAgeFields state={state} startAge={startAge} endAge={endAge} setStartAge={setStartAge} setEndAge={setEndAge} startAgeLabel="Buy Age" endAgeLabel="Sell Age"/>

            <LinkCard
              title="Link to a Home Loan"
              sub="Sync this house with an existing mortgage"
              items={availableHouseLoans}
              emptyMessage="No home loans available."
              selectedId={linkedLoanId}
              onSelect={handleHouseLoanSelect}
              isItemDisabled={(loan) => isLoanLinkedToAnotherHouse(loan)}
              error={linkError}
              syncedLabel={linkedLoan?.name}
            />

            <div className="preview-card">
              <div className="preview-card-header preview-card-header-mb10">
                <span className="preview-icon"><ChartBarIncreasing/></span>
                <span className="preview-card-label">Value After Year 1</span>
              </div>

              <div className="preview-card-amount preview-card-amount-lg">
                $
                {appreciatedValue.toLocaleString(undefined, {
                  maximumFractionDigits: 0,
                })}
              </div>

              <div className="preview-card-sub">
                +{Number(appreciation).toFixed(1)}% appreciation from ${(Number(houseValue) || 0).toLocaleString()}
              </div>
            </div>
          </div>
        </div>

        <FormSubmitButton label="Add House" />
      </form>
    </div>
  );
}

export function CarAssetForm({ dispatch,state, onClose, onToast }) {
  const [name, setName] = useState("");
  const [carValue, setCarValue] = useState("");
  const [depreciation, setDepreciation] = useState("12");
  const [downPayment, setDownPayment] = useState("");
  const [startAge, setStartAge] = useState("");
  const [endAge, setEndAge] = useState("");

  const [linkedLoanId, setLinkedLoanId] = useState("");
  const [linkError, setLinkError] = useState("");

  const availableCarLoans = state?.expenses?.car_loan || [];

  const linkedLoan = linkedLoanId
    ? availableCarLoans.find((loan) => loan.id === linkedLoanId)
    : null;

  const handleCarLoanSelect = (loanId: string) => {
    setLinkError("");

    if (!loanId) {
      setLinkedLoanId("");
      return;
    }

    const selectedLoan = availableCarLoans.find((loan) => loan.id === loanId);

    if (selectedLoan?.linked_asset_id) {
      setLinkError("This car loan is already linked to another car.");
      setLinkedLoanId("");
      return;
    }

    setLinkedLoanId(loanId);

    if (selectedLoan) {
      setName(selectedLoan.name.replace(" Loan", "") || "Car");
      setStartAge(selectedLoan.start_age.toString());

      if (selectedLoan.original_principal) {
        setCarValue(
          (
            Number(selectedLoan.original_principal || 0) +
            Number(downPayment || 0)
          ).toString()
        );
      }
    }
  };


  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const timeline = getValidatedTimelinePayload(state, startAge, endAge);

    if (timeline.invalid) {
        return;
    }
  
    if (linkError) return;
  
    const assetId = crypto.randomUUID();
  
    const carAsset: CarAsset = {
      source_type: "asset",
      variant: "car",
      id: assetId,
      name: name || "Car",
      start_age: timeline.start,
      end_age: timeline.end,
      asset_value: Number(carValue),
      annual_depreciation: Number(depreciation) / 100,
      down_payment: downPayment === "" ? null : Number(downPayment),
      linked_loan_id: linkedLoanId || null,
    };
  
    if (linkedLoanId) {
      const selectedLoan = availableCarLoans.find(
        (loan) => loan.id === linkedLoanId
      );
  
      if (selectedLoan) {
        dispatch({
          type: "UPDATE_EXPENSE",
          payload: {
            ...selectedLoan,
            linked_asset_id: assetId,
          },
        });
      }
    }
  
    dispatch({
      type: "ADD_ASSET",
      payload: carAsset,
    });

    onToast(name, "added");

    if (onClose) onClose();
  };

  const depreciatedValue = Number(carValue) * (1 - (Number(depreciation) || 0) / 100);
  return (
    <div className="form-panel">
      <FormHeader icon={<Car/>} title={"Add Car"} desc={"Track a vehicle asset with depreciation and optional down payment."} />

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
              <FormDollarInput value={carValue} onChange={setCarValue} placeholder="30,000" required />
            </div>

            <div className="form-field">
              <label className="form-label">Down Payment <span className="form-label-muted">(optional)</span></label>
              <FormDollarInput value={downPayment} onChange={setDownPayment} placeholder="5,000" />
            </div>

            <FormSlider label="Annual Depreciation" value={depreciation} onChange={setDepreciation} min={0} max={40} step={0.1} />
          </div>

          {/* RIGHT */}
          <div className="form-col">
            <p className="form-section-heading">Timeline</p>

            <TimelineAgeFields
              state={state}
              startAge={startAge}
              endAge={endAge}
              setStartAge={setStartAge}
              setEndAge={setEndAge}
              startAgeLabel="Buy Age" 
              endAgeLabel="Sell Age"
            />

            <LinkCard
              title="Link to a Car Loan"
              sub="Sync this car with an existing vehicle loan"
              items={availableCarLoans}
              emptyMessage="No car loans available."
              selectedId={linkedLoanId}
              onSelect={handleCarLoanSelect}
              isItemDisabled={(loan) => Boolean(loan.linked_asset_id)}
              error={linkError}
              syncedLabel={linkedLoan?.name}
            />

            <div className="preview-card">
              <div className="preview-card-header preview-card-header-mb10">
                <span className="preview-icon"><ChartBarDecreasing/></span>
                <span className="preview-card-label">Value After Year 1</span>
              </div>

              <div className="preview-card-amount preview-card-amount-lg">
                $
                {depreciatedValue.toLocaleString(undefined, {
                  maximumFractionDigits: 0,
                })}
              </div>

              <div className="preview-card-sub">
                -{Number(depreciation).toFixed(1)}% depreciation from ${(Number(carValue) || 0).toLocaleString()}
              </div>
            </div>
          </div>
        </div>

        <FormSubmitButton label="Add Car" />
      </form>
    </div>
  );
}

/* -------------------- EDIT ASSET FORMS -------------------- */
export function EditHouseAssetForm({ item, state, dispatch, onClose, onToast }) {
  const [name, setName] = useState(item.name);
  const [houseValue, setHouseValue] = useState(item.asset_value.toString());
  const [appreciation, setAppreciation] = useState((item.annual_appreciation * 100).toString());
  const [downPayment, setDownPayment] = useState(item.down_payment == null ? "" : item.down_payment.toString());
  const [startAge, setStartAge] = useState(item.start_age.toString());
  const [endAge, setEndAge] = useState(item.end_age?.toString() || "");

  const [linkedLoanId, setLinkedLoanId] = useState(item.linked_loan_id || "");
  const [linkError, setLinkError] = useState("");

  const availableHouseLoans = state?.expenses?.house_loan || [];

  const linkedLoan = linkedLoanId
    ? availableHouseLoans.find((loan) => loan.id === linkedLoanId)
    : null;

  const isAlreadyLinked = !!item.linked_loan_id;

  const handleHouseLoanSelect = (loanId: string) => {
    setLinkError("");

    if (!loanId) {
      setLinkedLoanId("");
      return;
    }

    const selectedLoan = availableHouseLoans.find((loan) => loan.id === loanId);

    if (selectedLoan?.linked_asset_id) {
      setLinkError("This home loan is already linked to another house.");
      setLinkedLoanId("");
      return;
    }

    setLinkedLoanId(loanId);
  };


  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const timeline = getValidatedTimelinePayload(state, startAge, endAge);

    if (timeline.invalid) {
        return;
    }

    if (linkError) return;

    const updatedHouseAsset = {
      ...item,
      source_type: "asset",
      variant: "house",
      name: name || "House",
      start_age: timeline.start,
      end_age: timeline.end,
      asset_value: Number(houseValue),
      annual_appreciation: Number(appreciation) / 100,
      down_payment: downPayment === "" ? null : Number(downPayment),
      linked_loan_id: item.linked_loan_id || linkedLoanId || null,
    };
    
    
    if (!isAlreadyLinked && linkedLoanId) {
      const selectedLoan = availableHouseLoans.find(
        (loan) => loan.id === linkedLoanId
      );
    
      if (selectedLoan) {
        dispatch({
          type: "UPDATE_EXPENSE",
          payload: {
            ...selectedLoan,
            linked_asset_id: item.id,
          },
        });
      }
    }

    dispatch({
      type: "UPDATE_ASSET",
      payload: updatedHouseAsset,
    });

    if (updatedHouseAsset.linked_loan_id) {
      const linkedLoan = availableHouseLoans.find((loan) => loan.id === updatedHouseAsset.linked_loan_id);
      if (linkedLoan) {
        dispatch({
          type: "UPDATE_EXPENSE",
          payload: {
            ...linkedLoan,
            start_age: timeline.start,
            end_age: timeline.end,
          },
        });
      }
    }

    onToast(name,"edited");
    
    onClose();
  };

  const appreciatedValue = Number(houseValue) * (1 + (Number(appreciation) || 0) / 100);

  return (
    <div className="form-panel">
      <FormHeader icon={<HousePlus/>} title={"Add House"} desc={"Update property value, appreciation rate, and timeline."} />

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
              <FormDollarInput value={houseValue} onChange={setHouseValue} placeholder="400,000" required />
            </div>

            <div className="form-field">
              <label className="form-label">Down Payment <span className="form-label-muted">(optional)</span></label>
              <FormDollarInput value={downPayment} onChange={setDownPayment} placeholder="80,000" />
            </div>

            <FormSlider label="Annual Appreciation" value={appreciation} onChange={setAppreciation} min={0} max={15} step={0.1} />
          </div>

          <div className="form-col">
            <p className="form-section-heading">Timeline</p>

            <TimelineAgeFields
              state={state}
              startAge={startAge}
              endAge={endAge}
              setStartAge={setStartAge}
              setEndAge={setEndAge}
              startAgeLabel="Buy Age" 
              endAgeLabel="Sell Age"
            />

            <LinkCard
              title="Link to a Home Loan"
              sub="Sync this house with an existing mortgage"
              items={availableHouseLoans}
              emptyMessage="No home loans available."
              selectedId={linkedLoanId}
              onSelect={handleHouseLoanSelect}
              isItemDisabled={(loan) => Boolean(loan.linked_asset_id)}
              error={linkError}
              isLocked={isAlreadyLinked}
              lockedLabel={linkedLoan?.name ?? "Home loan"}
              lockedSubMessage="Delete the linked loan to reassign"
              syncedLabel={linkedLoan?.name}
            />

            <div className="preview-card">
              <div className="preview-card-header preview-card-header-mb10">
                <span className="preview-icon"><ChartBarIncreasing/></span>
                <span className="preview-card-label">Value After Year 1</span>
              </div>

              <div className="preview-card-amount preview-card-amount-lg">
                $
                {appreciatedValue.toLocaleString(undefined, {
                  maximumFractionDigits: 0,
                })}
              </div>

              <div className="preview-card-sub">
                +{Number(appreciation).toFixed(1)}% appreciation from ${(Number(houseValue) || 0).toLocaleString()}
              </div>
            </div>
          </div>
        </div>

        <FormSubmitButton label="Update House" />
      </form>
    </div>
  );
}

export function EditCarAssetForm({ state, item, dispatch, onClose, onToast }) {
  const [name, setName] = useState(item.name);
  const [carValue, setCarValue] = useState(item.asset_value.toString());
  const [depreciation, setDepreciation] = useState(
    (item.annual_depreciation * 100).toString()
  );
  const [downPayment, setDownPayment] = useState(
    item.down_payment == null ? "" : item.down_payment.toString()
  );
  const [startAge, setStartAge] = useState(item.start_age.toString());
  const [endAge, setEndAge] = useState(item.end_age?.toString() || "");

  const [linkedLoanId, setLinkedLoanId] = useState(item.linked_loan_id || "");
  const [linkError, setLinkError] = useState("");

  const availableCarLoans = state?.expenses?.car_loan || [];

  const availableCars = state?.assets?.car || [];

  const getCarLinkedToLoan = (loanId: string) => {
    return availableCars.find((car) => car.linked_loan_id === loanId);
  };

  const isLoanLinkedToAnotherCar = (loan) => {
    const carLinkedFromAssetSide = getCarLinkedToLoan(loan.id);

    return Boolean(
      (loan.linked_asset_id && loan.linked_asset_id !== item.id) ||
        (carLinkedFromAssetSide && carLinkedFromAssetSide.id !== item.id)
    );
  };

  const linkedLoan = linkedLoanId
    ? availableCarLoans.find((loan) => loan.id === linkedLoanId)
    : null;

  const isAlreadyLinked = !!item.linked_loan_id;

  const handleCarLoanSelect = (loanId: string) => {
    setLinkError("");

    if (!loanId) {
      setLinkedLoanId("");
      return;
    }

    const selectedLoan = availableCarLoans.find(
      (loan) => loan.id === loanId
    );

    if (selectedLoan && isLoanLinkedToAnotherCar(selectedLoan)) {
      setLinkError("This car loan is already linked to another car.");
      setLinkedLoanId("");
      return;
    }

    setLinkedLoanId(loanId);
  };

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const timeline = getValidatedTimelinePayload(state, startAge, endAge);

    if (timeline.invalid) {
        return;
    }

    if (linkError) return;

    const updatedCarAsset = {
      ...item,
      source_type: "asset",
      variant: "car",
      name: name || "Car",
      start_age: timeline.start,
      end_age: timeline.end,
      asset_value: Number(carValue),
      annual_depreciation: Number(depreciation) / 100,
      down_payment: downPayment === "" ? null : Number(downPayment),

      // Keep existing link locked if already linked.
      linked_loan_id: item.linked_loan_id || linkedLoanId || null,
    };

    // Only create the two-way link if this car was not already linked.
    // If it was already linked, user must delete/recreate to reassign.
    if (!isAlreadyLinked && linkedLoanId) {
      const selectedLoan = availableCarLoans.find(
        (loan) => loan.id === linkedLoanId
      );

      if (selectedLoan) {
        dispatch({
          type: "UPDATE_EXPENSE",
          payload: {
            ...selectedLoan,
            linked_asset_id: item.id,
          },
        });
      }
    }


    dispatch({
      type: "UPDATE_ASSET",
      payload: updatedCarAsset,
    });

    if (updatedCarAsset.linked_loan_id) {
      const linkedLoan = availableCarLoans.find((loan) => loan.id === updatedCarAsset.linked_loan_id);
      if (linkedLoan) {
        dispatch({
          type: "UPDATE_EXPENSE",
          payload: {
            ...linkedLoan,
            start_age: timeline.start,
            end_age: timeline.end,
          },
        });
      }
    }

    onToast(name,"edited");
    
    onClose();
  };

  const depreciatedValue = Number(carValue) * (1 - (Number(depreciation) || 0) / 100);

  return (
    <div className="form-panel">
      <FormHeader icon={<Car/>} title={"Add Car"} desc={"Update vehicle value, depreciation rate, and timeline."} />

      <form onSubmit={onSubmit}>
        <div className="form-two-col">
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
                <input value={formatNumberWithCommas(carValue)} onChange={(e) => handleNumberInput(e, setCarValue)} className="form-input form-input-prefix-dollar" placeholder="30,000" type="text" inputMode="decimal" />
              </div>
            </div>

            <div className="form-field">
              <label className="form-label">
                Down Payment{" "}
                <span className="form-label-muted">(optional)</span>
              </label>
              <div className="form-input-wrap">
                <span className="form-input-prefix">$</span>
                <input value={formatNumberWithCommas(downPayment)} onChange={(e) => handleNumberInput(e, setDownPayment)} className="form-input form-input-prefix-dollar" placeholder="5,000" type="text" inputMode="decimal" />
              </div>
            </div>

            <FormSlider label="Annual Depreciation" value={depreciation} onChange={setDepreciation} min={0} max={30} step={0.5} />
          </div>

          <div className="form-col">
            <p className="form-section-heading">Timeline</p>

            <TimelineAgeFields state={state} startAge={startAge} endAge={endAge} setStartAge={setStartAge} setEndAge={setEndAge} startAgeLabel="Buy Age" endAgeLabel="Sell Age" />

            <LinkCard
              title="Link to a Car Loan"
              sub="Sync this car with an existing vehicle loan"
              items={availableCarLoans}
              emptyMessage="No car loans available."
              selectedId={linkedLoanId}
              onSelect={handleCarLoanSelect}
              isItemDisabled={(loan) => isLoanLinkedToAnotherCar(loan)}
              error={linkError}
              isLocked={isAlreadyLinked}
              lockedLabel={linkedLoan?.name ?? "Car loan"}
              lockedSubMessage="Delete the linked loan to reassign"
              syncedLabel={linkedLoan?.name}
            />

            <div className="preview-card">
              <div className="preview-card-header preview-card-header-mb10">
                <span className="preview-icon"><ChartBarDecreasing/></span>
                <span className="preview-card-label">Value After Year 1</span>
              </div>

              <div className="preview-card-amount preview-card-amount-lg">
                $
                {depreciatedValue.toLocaleString(undefined, {
                  maximumFractionDigits: 0,
                })}
              </div>

              <div className="preview-card-sub">
                -{Number(depreciation).toFixed(1)}% depreciation from ${(Number(carValue) || 0).toLocaleString()}
              </div>
            </div>
          </div>
        </div>

        <FormSubmitButton label="Update Car" />
      </form>
    </div>
  );
}