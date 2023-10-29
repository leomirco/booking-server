document.addEventListener('DOMContentLoaded', async () => {
  // Get URL string
  //var url_parent = window.parent.locatio;
  var url_string = window.location.href;
  var url = new URL(url_string);
  console.log('CLIENT - url', url);
  var orderId = url.searchParams.get("orderId");
  console.log('CLIENT - orderId', orderId);
  //var clientSecret_old = url.searchParams.get("clientSecret");
  //console.log('CLIENT - clientSecret_old', clientSecret_old);
  //console.log('PARENT - url', url_parent);
  // CONFIG KEY SEGRET
  // Load the publishable key from the server. The publishable key
  // is set in your .env file.
  var projectId = url.searchParams.get("projectId");
  console.log('CLIENT - projectId', projectId);
  const { publishableKey } = await fetch('/bcserver/config?projectId=' + projectId).then((r) => r.json());
  if (!publishableKey) {
    addMessage(
      'No publishable key returned from the server. Please configure the App and try again'
    );
    // ATTENTION: COMMENT
    //alert('Please set your Stripe publishable API key in the configure function');
  } else {
    console.log('CLIENT - publishableKey', publishableKey);
  }

  const stripe = Stripe(publishableKey, {
    apiVersion: '2020-08-27',
  });

  console.log('CLIENT - stripe: ', stripe)
  //-------------------------------------------
  //var currency = url.searchParams.get("currency");
  //console.log('CLIENT - currency', currency);
  //var amount = url.searchParams.get("amount");
  //console.log('CLIENT - amount', amount);
  //var description = url.searchParams.get("description");
  //console.log('CLIENT - description', description);

  // CUSTOMER
  //var customer_mail = url.searchParams.get("customer_mail");
  //console.log('CLIENT - customer_mail', customer_mail);
  //var customer_name = url.searchParams.get("customer_name");
  //console.log('CLIENT - customer_name', customer_name);



  // On page load, we create a PaymentIntent on the server so that we have its clientSecret to
  // initialize the instance of Elements below. The PaymentIntent settings configure which payment
  // method types to display in the PaymentElement.
  //ATTENTO URL DA MODIFICARE CON PRODUZIONE
  console.log('CLIENT - DOMAIN - url', url.origin);
  let url_post = new URL(url.origin + '/bcserver/payment-control');
  let params = { 'orderId': orderId };
  url_post.search = new URLSearchParams(params);
  //---------------------------------------------------------------------------
  const {
    paid
  } = await fetch(url_post).then(r => r.json());
  if (paid == true) {
    console.log('CLIENT - paid', paid);
    document.getElementById('payment-form').style.display = 'none';
    document.getElementById('paySent').style.display = 'block';
  } else {
    console.log('CLIENT - paid', paid);
  }

  // Initialize Stripe Elements with the PaymentIntent's clientSecret,
  // then mount the payment element.
  console.log('CLIENT - orderId', orderId);
  const { clientSecret } = await fetch('/bcserver/clientSecret?orderId=' + orderId).then((r) => r.json());
  console.log('CLIENT - clientSecret', clientSecret);

  const elements = stripe.elements({ clientSecret });
  const paymentElement = elements.create('payment');
  paymentElement.mount('#payment-element');


  // When the form is submitted...
  const form = document.getElementById('payment-form');
  let submitted = false;
  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    // Disable double submission of the form
    if (submitted) { return; }
    submitted = true;
    form.querySelector('button').disabled = true;
    console.log('submitted: ', submitted);


    const nameInput = document.querySelector('#name');

    // Confirm the card payment given the clientSecret
    // from the payment intent that was just created on
    // the server.
    // ATTENTO COMMENTATA
    try {
      const { error: stripeError } = await stripe.confirmPayment({
        elements,
        redirect: "if_required",
        confirmParams: {
          return_url: `${window.location.href}/return.html`,
        }
      });
      if (stripeError) {
        console.log('stripeError: ', stripeError);
        // reenable the form.
        submitted = false;
        form.querySelector('button').disabled = false;
        return;
      } else {
        form.style.display = 'none';
        document.getElementById('paySent').style.display = 'block';
      }
    } catch (e) {
      console.log('stripeError', e);
      submitted = false;
      form.querySelector('button').disabled = false;
      form.style.display = 'block';
      document.getElementById('paySent').style.display = 'none';
      document.getElementById('messages').style.visibility = "visible";
      document.getElementById('messages').innerHTML = 'Wrong publishable key!';
      return;
    }
  });
});