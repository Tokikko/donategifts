let elements = stripe.elements();

// Todo: this needs to be edited
// Custom styling can be passed to options when creating an Element.
let style = {
  base: {
    fontSize: '16px',
    color: '#32325d',
  },
};

let card = elements.create('card', { style: style });

// Add an instance of the card Element into the `card-element` <div>.
card.mount('#card-element');

// Handle real-time validation errors from the card Element.
card.on('change', function (event) {
  let displayError = document.getElementById('card-errors');
  if (event.error) {
    displayError.textContent = event.error.message;
  } else {
    displayError.textContent = '';
  }
});

// Form submission.
let form = document.getElementById('payment-form');
form.addEventListener('submit', function (event) {
  event.preventDefault();
  loading(true);
  stripe.createToken(card).then(function (result) {
    if (result.error) {
      // Inform the user if there was an error.
      let errorElement = document.getElementById('card-errors');
      errorElement.textContent = result.error.message;
      loading(false);
    } else {
      // Send the token to your server.
      
      let wishCardId = document.getElementById('cardId');
      let agencyName = document.getElementById('agencyName');
      fetch('/stripe/createIntent', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          wishCardId: wishCardId.innerText,
          agencyName: agencyName.innerText,
        }),
      })
        .then((response) => response.json())
        .then((data) => {
          payWithCard(stripe, card, data.clientSecret);
        })
        .catch((error) => {
          console.error('Error:', error);
          showToast('An error has occured while processing payment');
          loading(false);
        });
    }
  });
});

let payWithCard = function (stripe, card, clientSecret) {
  loading(true);
  stripe
    .confirmCardPayment(clientSecret, {
      payment_method: {
        card: card,
      },
    })
    .then(function (result) {
      if (result.error) {
        showError(result.error.message);
      } else {
        orderComplete(result.paymentIntent.id);
      }
    });
};

let loading = function (isLoading) {
  if (isLoading) {
    // Disable the button and show a spinner
    document.getElementById('submit').disabled = true;
    document.querySelector('#spinner').classList.remove('hidden');
    document.querySelector('#button-text').classList.add('hidden');
  } else {
    document.getElementById('submit').disabled = false;
    document.querySelector('#spinner').classList.add('hidden');
    document.querySelector('#button-text').classList.remove('hidden');
  }
};

let orderComplete = function (paymentIntentId) {
  loading(false);
  document.querySelector('.result-message').classList.remove('hidden');
  document.querySelector('#submit').setAttribute('disabled', 'true');
  redirectAfterSuccessfullPayment();
};

let showError = function (errorMsgText) {
  loading(false);
  let errorMsg = document.querySelector('#card-errors');
  errorMsg.textContent = errorMsgText;
  setTimeout(function () {
    errorMsg.textContent = '';
  }, 4000);
};

let redirectAfterSuccessfullPayment = function () {
  let wishCardId = document.getElementById('cardId');
  window.location.replace(`/stripe/payment/success/${wishCardId.innerText}`);
}