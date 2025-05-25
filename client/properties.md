# KOELON PROPERTIES

## LOADING
```html
<div class="loading">
  <div class="box">
    <div class="spinner">
      <i class="fa-solid fa-spinner fa-spin"></i>
    </div>
    <div class="msg"><p>LOADING</p></div>
  </div>
</div>
```
## SMALL LOADING
```html
<div class="sm-loading">
  <i class="fa-solid fa-loader fa-spin"></i>
  <span>Loading</span>
</div>
```
## MODAL
```html
<div class="modal">
  <div class="box">
    <div class="ic">
      <p><i class="fa-duotone fa-circle-exclamation"></i></p>
    </div>
    <div class="inf">
      <p>Lorem ipsum dolor sit amet consectetur adipisicing elit. Impedit, ducimus.</p>

      <input type="text" name="prompt-field" id="prompt-field" autocomplete="off" maxlength="100" placeholder="Type Here"/>

      <textarea name="prompt-fieldz" id="prompt-fieldz" maxlength="300" placeholder="Type Here"></textarea>

      <form class="modal-radio-form" id="modal-radio-form">
        <div class="radio">
          <label for="apt-blok-a5">
            <input type="radio" name="apt" id="apt-blok-a5" value="blok-a5" required />
            <p>Blok A5</p>
          </label>
        </div>
        <div class="radio">
          <label for="apt-blok-d4">
            <input type="radio" name="apt" id="apt-blok-d4" value="blok-d4" required />
            <p>Blok D4</p>
          </label>
        </div>
      </form>
    </div>
    <div class="acts">
      <button class="btn btn-cancel">CANCEL</button>
      <button class="btn btn-ok">OK</button>
    </div>
    <div class="act">
      <button class="btn btn-ok">OK</button>
    </div>
  </div>
</div>
```