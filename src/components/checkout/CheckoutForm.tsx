"use client";

import { money } from "@/config/utils";
import { UseCheckoutReturn } from "@/hooks/useCheckout";
import { CheckoutContactStep } from "./CheckoutContactStep";
import { CheckoutAddressStep } from "./CheckoutAddressStep";

interface CheckoutFormProps {
  checkout: UseCheckoutReturn;
}

export function CheckoutForm({ checkout }: CheckoutFormProps) {
  const {
    form,
    errors,
    submitting,
    total,
    updateField,
    handlePlaceOrder,
  } = checkout;

  return (
    <div className="space-y-10">
      <CheckoutContactStep
        email={form.email}
        error={errors.email}
        onChange={(v) => updateField("email", v)}
      />

      <CheckoutAddressStep
        form={form}
        errors={errors}
        onChange={updateField}
      />

      {errors.form && <p className="text-sm text-red-500">{errors.form}</p>}

      <button
        type="button"
        disabled={submitting}
        className="btn w-full disabled:opacity-60 text-center"
        onClick={handlePlaceOrder}
      >
        {submitting
          ? "Confirming order details..."
          : `Confirm & Order via Instagram (${money(total)})`}
      </button>
    </div>
  );
}

