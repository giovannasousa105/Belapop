export interface CheckoutFormState {
  name: string;
  email: string;
  cpf: string;
  phone: string;
  street: string;
  number: string;
  complement?: string;
  neighborhood?: string;
  city: string;
  state: string;
  cep: string;
}
