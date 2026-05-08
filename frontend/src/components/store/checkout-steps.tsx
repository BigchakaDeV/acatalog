export function CheckoutSteps({ step }: { step: number }) {
  const steps = ['Endereco', 'Pagamento', 'Revisao', 'Confirmacao'];
  return (
    <div className="grid grid-cols-4 gap-2">
      {steps.map((label, index) => (
        <div key={label} className={`rounded-lg px-3 py-2 text-center text-xs font-bold ${index <= step ? 'bg-ink text-white' : 'surface'}`}>
          {label}
        </div>
      ))}
    </div>
  );
}
