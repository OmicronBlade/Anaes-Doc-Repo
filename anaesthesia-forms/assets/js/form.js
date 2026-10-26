/*
 * FormKit — shared behaviour for every form page.
 *
 *   FormKit.init({
 *     id: "cs-prescription",           // storage key (unique per form)
 *     version: "1.0",                  // shown in toolbar only
 *     printTitle: function (get) {...} // optional: PDF file name from field values
 *     autofill: { "field_name": "value", ... }  // optional preset values
 *     onReady: function () {}          // optional: after a saved draft has been restored
 *     onReset: function () {}          // optional: after the Clear button resets the form
 *   });
 *
 * Every <input>/<textarea>/<select> with a name="" inside #form is
 * auto-saved to this browser (localStorage) and restored on reload.
 */
(function () {
  "use strict";

  var PREFIX = "anaesthesia-forms:draft:";
  var MIN_FONT_PX = 8;

  function $(sel, root) { return (root || document).querySelector(sel); }
  function $$(sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); }

  var store = {
    get: function (k) { try { return JSON.parse(localStorage.getItem(k)); } catch (e) { return null; } },
    set: function (k, v) { try { localStorage.setItem(k, JSON.stringify(v)); return true; } catch (e) { return false; } },
    del: function (k) { try { localStorage.removeItem(k); } catch (e) {} }
  };

  // ---------- text fitting: shrink long entries to fit their box ----------
  var baseSize = new WeakMap();

  function fit(el) {
    // Multi-line boxes keep their ruled line spacing, so they are flagged instead of shrunk
    if (el.tagName === "TEXTAREA") {
      el.classList.toggle("overflowing", el.scrollHeight > el.clientHeight + 2);
      return;
    }
    if (el.tagName !== "INPUT" || el.type === "checkbox" || el.type === "radio") return;
    if (!baseSize.has(el)) baseSize.set(el, parseFloat(getComputedStyle(el).fontSize));
    var size = baseSize.get(el);
    el.style.fontSize = "";
    if (!el.value) return;
    while (el.scrollWidth > el.clientWidth + 1 && size > MIN_FONT_PX) {
      size -= 0.5;
      el.style.fontSize = size + "px";
    }
  }

  function toast(msg) {
    var t = $(".toast");
    if (!t) { t = document.createElement("div"); t.className = "toast"; document.body.appendChild(t); }
    t.textContent = msg;
    t.classList.add("show");
    clearTimeout(toast._t);
    toast._t = setTimeout(function () { t.classList.remove("show"); }, 2200);
  }

  function init(cfg) {
    var form = $("#form");
    var key = PREFIX + cfg.id;
    var statusEl = $("#save-status");
    var saveTimer = null;

    function fields() { return $$("input[name], textarea[name], select[name]", form); }

    function byName() {
      var map = {};
      fields().forEach(function (f) { map[f.name] = f; });
      return map;
    }

    function setValue(f, v) {
      if (f.type === "checkbox" || f.type === "radio") f.checked = !!v;
      else f.value = v == null ? "" : v;
    }
    function getValue(f) {
      return (f.type === "checkbox" || f.type === "radio") ? f.checked : f.value;
    }
    // The value a field has in the HTML (e.g. Ward = "LW", Lock Out = "8"): Clear returns to it
    function defaultOf(f) {
      return (f.type === "checkbox" || f.type === "radio") ? f.defaultChecked : f.defaultValue;
    }

    function stamp(d) {
      return d.toLocaleTimeString("en-ZA", { hour: "2-digit", minute: "2-digit" });
    }

    function save() {
      var data = {};
      var any = false;
      fields().forEach(function (f) {
        var v = getValue(f);
        // store only what differs from the default (including a default deliberately emptied)
        if (v !== defaultOf(f)) { data[f.name] = v; any = true; }
      });
      if (!any) { store.del(key); setStatus("No draft"); return; }
      var ok = store.set(key, { version: cfg.version, savedAt: new Date().toISOString(), data: data });
      setStatus(ok ? "Draft saved " + stamp(new Date()) : "Draft not saved (storage blocked)");
    }

    function queueSave() {
      setStatus("Saving…");
      clearTimeout(saveTimer);
      saveTimer = setTimeout(save, 400);
    }

    function setStatus(s) { if (statusEl) statusEl.textContent = s; }

    function restore() {
      var draft = store.get(key);
      if (!draft || !draft.data) { setStatus("No draft"); return; }
      var map = byName();
      Object.keys(draft.data).forEach(function (n) { if (map[n]) setValue(map[n], draft.data[n]); });
      setStatus("Draft restored · " + stamp(new Date(draft.savedAt)));
    }

    function fitAll() { fields().forEach(fit); }

    // ---------- events ----------
    form.addEventListener("input", function (e) {
      fit(e.target);
      queueSave();
    });
    form.addEventListener("change", queueSave);

    // ---------- shared components ----------
    // Exclusive choices: checkboxes sharing data-group behave like radio buttons
    // (but can be un-ticked, which a paper form allows)
    form.addEventListener("change", function (e) {
      var t = e.target;
      if (t.type === "checkbox" && t.checked && t.dataset.group) {
        $$('input[data-group="' + t.dataset.group + '"]', form).forEach(function (o) {
          if (o !== t && o.checked) o.checked = false;
        });
      }
      syncCells();
    });

    // Table blocks that are "circled": <td class="circle-cell"><input type="checkbox" ...></td>
    function syncCells() {
      $$("td.circle-cell", form).forEach(function (td) {
        var cb = $("input[type=checkbox]", td);
        td.classList.toggle("is-circled", !!(cb && cb.checked));
      });
    }
    form.addEventListener("click", function (e) {
      var td = e.target.closest && e.target.closest("td.circle-cell");
      if (!td || e.target.tagName === "INPUT") return;
      var cb = $("input[type=checkbox]", td);
      cb.checked = !cb.checked;
      cb.dispatchEvent(new Event("change", { bubbles: true }));
    });

    // Today / Now buttons: data-fill-today="field" (dd/mm/yyyy), data-fill-now="field" (HH:MM)
    document.addEventListener("click", function (e) {
      var b = e.target.closest && e.target.closest("[data-fill-today],[data-fill-now]");
      if (!b) return;
      var now = new Date(), pad = function (n) { return String(n).padStart(2, "0"); };
      var name = b.dataset.fillToday || b.dataset.fillNow;
      var f = $('[name="' + name + '"]', form);
      if (!f) return;
      f.value = b.dataset.fillToday
        ? pad(now.getDate()) + "/" + pad(now.getMonth() + 1) + "/" + now.getFullYear()
        : pad(now.getHours()) + ":" + pad(now.getMinutes());
      f.dispatchEvent(new Event("input", { bubbles: true }));
    });

    // Enter moves to the next field (like a paper form, no accidental submits)
    form.addEventListener("keydown", function (e) {
      if (e.key !== "Enter" || e.target.tagName !== "INPUT") return;
      e.preventDefault();
      var list = fields().filter(function (f) { return !f.disabled && f.offsetParent !== null; });
      var i = list.indexOf(e.target);
      var next = list[i + (e.shiftKey ? -1 : 1)];
      if (next) next.focus();
    });

    var clearBtn = $("#btn-clear");
    if (clearBtn) clearBtn.addEventListener("click", function () {
      if (!confirm("Clear every field on this form and delete the saved draft?")) return;
      fields().forEach(function (f) { setValue(f, defaultOf(f)); f.style.fontSize = ""; });
      store.del(key);
      setStatus("No draft");
      toast("Form cleared");
      syncCells();
      if (typeof cfg.onReset === "function") cfg.onReset();
    });

    var printBtn = $("#btn-print");
    if (printBtn) printBtn.addEventListener("click", function () { window.print(); });

    // Name the PDF after the patient when printing
    var originalTitle = document.title;
    window.addEventListener("beforeprint", function () {
      if (typeof cfg.printTitle === "function") {
        var map = byName();
        var t = cfg.printTitle(function (n) { return map[n] ? String(getValue(map[n])).trim() : ""; });
        if (t) document.title = t.replace(/[\\/:*?"<>|]+/g, "-");
      }
    });
    window.addEventListener("afterprint", function () { document.title = originalTitle; });

    var fillBtn = $("#btn-autofill");
    if (fillBtn && cfg.autofill) fillBtn.addEventListener("click", function () {
      var map = byName();
      var names = Object.keys(cfg.autofill);
      var conflicts = names.filter(function (n) {
        return map[n] && map[n].value.trim() !== "" && map[n].value !== cfg.autofill[n];
      });
      if (conflicts.length &&
          !confirm("Some fields already contain entries. Overwrite them with the standard values?")) return;
      names.forEach(function (n) {
        var f = map[n];
        if (!f) return;
        setValue(f, cfg.autofill[n]);
        fit(f);
        f.classList.add("just-filled");
        setTimeout(function () { f.classList.remove("just-filled"); }, 1400);
      });
      save();
      toast("Standard values filled in");
    });

    // ---------- start ----------
    restore();
    syncCells();
    // fonts may load late; refit once they do
    fitAll();
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(fitAll);
    if (typeof cfg.onReady === "function") cfg.onReady();
  }

  window.FormKit = { init: init, fit: fit, toast: toast };
})();
