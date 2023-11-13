import { Component, OnInit } from '@angular/core';
import { debounceTime } from 'rxjs/operators';
import { Customer } from './customer';
import { AbstractControl, FormArray, FormBuilder, FormGroup, ValidatorFn, Validators } from '@angular/forms';

function ratingRange(min: number, max: number): ValidatorFn {
  return (c: AbstractControl): { [key: string]: boolean } | null => {
    if (c.value !== null && isNaN(c.value)) {
      return { 'nan': true };
    }
    if (c.value !== null && (c.value < min || c.value > max)) {
      return { 'range': true };
    }
    return null;
  }
}

function passwordMatcher(c: AbstractControl): { [key: string]: boolean } | null {
  const password = c.get('password');
  const confirmPassword = c.get('confirmPassword');

  if (password?.pristine || confirmPassword?.pristine) {
    return null;
  }
  if (password?.value !== confirmPassword?.value) {
    return { 'match': true }
  }
  return null;
}


@Component({
  selector: 'app-customer',
  templateUrl: './customer.component.html',
  styleUrls: ['./customer.component.css']
})
export class CustomerComponent implements OnInit {
  customer = new Customer();
  customerForm: FormGroup;
  emailMessage: string = '';
  private validationMessages = {
    required: 'Please enter your email address',
    email: 'Please enter a valid email'
  }

  get addresses(): FormArray{
    return <FormArray>this.customerForm.get('addresses');
  }

  constructor(private fb: FormBuilder) {
    this.customerForm = this.fb.group({
      firstName: ['', [Validators.required, Validators.minLength(3)]],
      lastName: ['', [Validators.required, Validators.maxLength(50)]],
      passwordGroup: this.fb.group({
        password: ['', [Validators.required]],
        confirmPassword: ['', [Validators.required]]
      }, { validator: passwordMatcher }),
      email: ['', [Validators.required, Validators.email]],
      phone: '',
      notification: 'email',
      rating: [null, ratingRange(1, 10)],
      sendCatalog: true,
      addresses: this.fb.array([this.buildAddress()])
    })
  }

  ngOnInit(): void {
    this.customerForm.get('notification')?.valueChanges.subscribe(
      value => this.setNotification(value)
    );
    const emailControl = this.customerForm.get('email');
    emailControl?.valueChanges.pipe(debounceTime(1000)).subscribe(
      value => this.setMessage(emailControl)
    )
  }

  save(): void {
    console.log(this.customerForm);
    console.log('Saved: ' + JSON.stringify(this.customerForm.value));
  }

  populateTestData(): void {
    this.customerForm.setValue({
      firstName: 'Jack',
      lastName: 'Harkness',
      email: 'jharkness@g.com',
      rating: null,
      sendCatalog: false
    });
  }

  buildAddress(): FormGroup {
    return this.fb.group({
      addressType: 'home',
      street1: '',
      street2: '',
      city: '',
      state: '',
      zip: ''
    })
  }

  addAddress(): void{
    this.addresses.push(this.buildAddress());
  }

  setMessage(c: AbstractControl): void {
    this.emailMessage = '';
    if ((c.touched || c.dirty) && c.errors) {
      this.emailMessage = Object.keys(c.errors).map(key => this.validationMessages[key as 'required']).join(' ');
    }
  }
  setNotification(notifyVia: string): void {
    const phoneControl = this.customerForm.get('phone')
    if (notifyVia === 'phone') {
      phoneControl?.setValidators([Validators.required, Validators.maxLength(30)])
    } else {
      phoneControl?.clearValidators();
    }
    phoneControl?.updateValueAndValidity();
  }
}
