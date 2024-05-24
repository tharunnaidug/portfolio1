console.log("hello world")
let cursor = document.getElementsByClassName("cursor")
const main = document.getElementById("main")
const toggle = document.getElementById(`toggle`);
const label = document.getElementById(`toggleIcon`);
const btn = document.getElementById(`about-btn`)
const canbtn = document.getElementById(`about-btn1`)
const about = document.getElementsByClassName(`about`)


// main.addEventListener("mousemove",(e)=>{

// })
main.onmousemove = (e) => {
    cursor[0].style.left = e.clientX + "px";
    cursor[0].style.top = e.clientY + "px";
}

toggle.addEventListener(`change`, (e) => {
    label.classList.toggle('dark')
    document.body.classList.toggle(`dark`, e.target.checked);
})

btn.addEventListener("click", () => {
    about[0].style.display = "block"
})

canbtn.addEventListener("click", () => {
    about[0].style.display = "none"
})

// Swiper js
document.addEventListener('DOMContentLoaded', () => {
    // Initialize Swiper
    var swiper = new Swiper(".mySwiper", {
        slidesPerView: 1,
        speed: 200,
        autoplay: {
            delay: 5000,
          },
        spaceBetween: 5,
        loop: true,
        pagination: {
            el: ".swiper-pagination",
            clickable: true,
        },
    });
});

//web3forms
const form = document.getElementById('form');
const result = document.getElementById('result');

form.addEventListener('submit', function(e) {
  e.preventDefault();
  const formData = new FormData(form);
  const object = Object.fromEntries(formData);
  const json = JSON.stringify(object);
  result.innerHTML = "Please wait..."

    fetch('https://api.web3forms.com/submit', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: json
        })
        .then(async (response) => {
            let json = await response.json();
            if (response.status == 200) {
                result.innerHTML = "Form submitted successfully";
            } else {
                console.log(response);
                result.innerHTML = json.message;
            }
        })
        .catch(error => {
            console.log(error);
            result.innerHTML = "Something went wrong!";
        })
        .then(function() {
            form.reset();
            setTimeout(() => {
                result.style.display = "none";
            }, 3000);
        });
});