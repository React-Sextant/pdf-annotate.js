import PDFJSAnnotate from '../index';

const { UI } = PDFJSAnnotate;
const documentId = 'example.pdf';
let PAGE_HEIGHT;
let RENDER_OPTIONS = {
  documentId,
  pdfDocument: null,
  scale: parseFloat(localStorage.getItem(`${documentId}/scale`), 10) || 1.33,
  rotate: parseInt(localStorage.getItem(`${documentId}/rotate`), 10) || 0
};
let SWIPER_SCALE;

PDFJSAnnotate.setStoreAdapter(new PDFJSAnnotate.LocalStoreAdapter());
pdfjsLib.workerSrc = './shared/pdf.worker.js';

// Render stuff
let NUM_PAGES = 0;
document.getElementById('content-wrapper').addEventListener('scroll', function (e) {
  let visiblePageNum = Math.round(e.target.scrollTop / PAGE_HEIGHT) + 1;
  let visiblePage = document.querySelector(`.page[data-page-number="${visiblePageNum}"][data-loaded="false"]`);
  if (visiblePage) {
    setTimeout(function () {
      UI.renderPage(visiblePageNum, RENDER_OPTIONS)
    });
  }
});

function render() {
  pdfjsLib.getDocument(RENDER_OPTIONS.documentId).then((pdf) => {
    RENDER_OPTIONS.pdfDocument = pdf;

    let viewer = document.getElementById('viewer');
    viewer.innerHTML = '';
    NUM_PAGES = pdf._pdfInfo.numPages;
    for (let i=0; i<NUM_PAGES; i++) {
      let page = UI.createPage(i+1);
      viewer.appendChild(page);
    }

    new Swiper ('.swiper-container', {
      touchMoveStopPropagation : false,
      on:{
        slideChange: function(){
          let visiblePageNum = this.activeIndex+1;
          let visiblePage = document.querySelector(`.page[data-page-number="${visiblePageNum}"][data-loaded="false"]`);
          if (visiblePage) {
            setTimeout(function () {
              UI.renderPage(visiblePageNum, RENDER_OPTIONS).then(res=>{
                //及时修正swiper错位问题
                if(!SWIPER_SCALE){
                  SWIPER_SCALE = UI.getTranslate(document.getElementById('viewer'));
                }else if(UI.getTranslate(document.getElementById('viewer'))%SWIPER_SCALE !== 0){
                  document.getElementById('viewer').style.webkitTransform = `translate3d(${this.activeIndex*SWIPER_SCALE}px, 0px, 0px)`;
                  document.getElementById('viewer').style.transform = `translate3d(${this.activeIndex*SWIPER_SCALE}px, 0px, 0px)`
                }

                //及时收回内存
                if(visiblePageNum>3){
                  canvasDestory(visiblePageNum-3);
                }
              })
            });
          }else if(document.querySelector(`.page[data-page-number="${visiblePageNum+3}"][data-loaded="true"]`)){
            canvasDestory(visiblePageNum+3);
          }

          /**
           * 释放canvas内存
           *
           * 删除当前页之前第{page张和之后第{page}张内存（暂定为3）
           * **/
          function canvasDestory(page){
            let _canvas = document.getElementById(`pageContainer${page}`).children[0].children[0];
            _canvas.getContext('2d').clearRect(0,0,_canvas.width,_canvas.height);
            document.getElementById(`pageContainer${page}`).dataset.loaded = "false"
          }
        },
      },
    });

    UI.renderPage(1, RENDER_OPTIONS).then(([pdfPage, annotations]) => {
      let viewport = pdfPage.getViewport(RENDER_OPTIONS.scale, RENDER_OPTIONS.rotate);
      PAGE_HEIGHT = viewport.height;
    });
  });
}
render();

// Text stuff
// (function () {
//   let textSize;
//   let textColor;
//
//   function initText() {
//     let size = document.querySelector('.toolbar .text-size');
//     [8, 9, 10, 11, 12, 14, 18, 24, 30, 36, 48, 60, 72, 96].forEach((s) => {
//       size.appendChild(new Option (s, s));
//     });
//
//     setText(
//       localStorage.getItem(`${RENDER_OPTIONS.documentId}/text/size`) || 10,
//       localStorage.getItem(`${RENDER_OPTIONS.documentId}/text/color`) || '#000000'
//     );
//
//     initColorPicker(document.querySelector('.text-color'), textColor, function (value) {
//       setText(textSize, value);
//     });
//   }
//
//   function setText(size, color) {
//     let modified = false;
//
//     if (textSize !== size) {
//       modified = true;
//       textSize = size;
//       localStorage.setItem(`${RENDER_OPTIONS.documentId}/text/size`, textSize);
//       document.querySelector('.toolbar .text-size').value = textSize;
//     }
//
//     if (textColor !== color) {
//       modified = true;
//       textColor = color;
//       localStorage.setItem(`${RENDER_OPTIONS.documentId}/text/color`, textColor);
//
//       let selected = document.querySelector('.toolbar .text-color.color-selected');
//       if (selected) {
//         selected.classList.remove('color-selected');
//         selected.removeAttribute('aria-selected');
//       }
//
//       selected = document.querySelector(`.toolbar .text-color[data-color="${color}"]`);
//       if (selected) {
//         selected.classList.add('color-selected');
//         selected.setAttribute('aria-selected', true);
//       }
//
//     }
//
//     if (modified) {
//       UI.setText(textSize, textColor);
//     }
//   }
//
//   function handleTextSizeChange(e) {
//     setText(e.target.value, textColor);
//   }
//
//   // document.querySelector('.toolbar .text-size').addEventListener('change', handleTextSizeChange);
//
//   initText();
// })();

// // Pen stuff
// (function () {
//   let penSize;
//   let penColor;
//
//   function initPen() {
//     let size = document.querySelector('.toolbar .pen-size');
//     for (let i=0; i<20; i++) {
//       size.appendChild(new Option(i+1, i+1));
//     }
//
//     setPen(
//       localStorage.getItem(`${RENDER_OPTIONS.documentId}/pen/size`) || 1,
//       localStorage.getItem(`${RENDER_OPTIONS.documentId}/pen/color`) || '#000000'
//     );
//
//     initColorPicker(document.querySelector('.pen-color'), penColor, function (value) {
//       setPen(penSize, value);
//     });
//   }
//
//   function setPen(size, color) {
//     let modified = false;
//
//     if (penSize !== size) {
//       modified = true;
//       penSize = size;
//       localStorage.setItem(`${RENDER_OPTIONS.documentId}/pen/size`, penSize);
//       document.querySelector('.toolbar .pen-size').value = penSize;
//     }
//
//     if (penColor !== color) {
//       modified = true;
//       penColor = color;
//       localStorage.setItem(`${RENDER_OPTIONS.documentId}/pen/color`, penColor);
//
//       let selected = document.querySelector('.toolbar .pen-color.color-selected');
//       if (selected) {
//         selected.classList.remove('color-selected');
//         selected.removeAttribute('aria-selected');
//       }
//
//       selected = document.querySelector(`.toolbar .pen-color[data-color="${color}"]`);
//       if (selected) {
//         selected.classList.add('color-selected');
//         selected.setAttribute('aria-selected', true);
//       }
//     }
//
//     if (modified) {
//       UI.setPen(penSize, penColor);
//     }
//   }
//
//   function handlePenSizeChange(e) {
//     setPen(e.target.value, penColor);
//   }
//
//   document.querySelector('.toolbar .pen-size').addEventListener('change', handlePenSizeChange);
//
//   initPen();
// })();

// Toolbar buttons
(function () {
  setActiveToolbarItem('cursor');
  UI.setPen(3,'#FF0000');
  UI.setText(14);

  function setActiveToolbarItem(type, button) {
      switch (type) {
        case 'cancel':
          document.querySelector('.draw-confirm').style.display = 'none';
          UI.disablePen();
          UI.enableEdit();
          break;
        case 'cursor':
          document.querySelector('.default-toolbar').style.display = 'none';
          document.querySelector('.draw-confirm').style.display = 'none';
          UI.disablePen();
          UI.enableEdit();
          break;
        case 'draw':
          UI.enablePen();
          document.querySelector('.default-toolbar').style.display = 'none';
          document.querySelector('.draw-confirm').style.display = '';
          break;
        case 'text':
          UI.enableText();
          document.querySelector('.default-toolbar').style.display = 'none';
          break;
        case 'point':
          UI.enablePoint();
          break;
        case 'area':
        case 'highlight':
        case 'strikeout':
          UI.enableRect(type);
          break;
      }
  }

  function handleToolbarClick(e) {
    if (typeof e.target.getAttribute('data-tooltype') === 'string') {
      setActiveToolbarItem(e.target.getAttribute('data-tooltype'), e.target);
    }
  }

  document.querySelector('.toolbar').addEventListener('click', handleToolbarClick);
})();

// // Scale/rotate
// (function () {
//   function setScaleRotate(scale, rotate) {
//     scale = parseFloat(scale, 10);
//     rotate = parseInt(rotate, 10);
//
//     if (RENDER_OPTIONS.scale !== scale || RENDER_OPTIONS.rotate !== rotate) {
//       RENDER_OPTIONS.scale = scale;
//       RENDER_OPTIONS.rotate = rotate;
//
//       localStorage.setItem(`${RENDER_OPTIONS.documentId}/scale`, RENDER_OPTIONS.scale);
//       localStorage.setItem(`${RENDER_OPTIONS.documentId}/rotate`, RENDER_OPTIONS.rotate % 360);
//
//       render();
//     }
//   }
//
//   function handleScaleChange(e) {
//     setScaleRotate(e.target.value, RENDER_OPTIONS.rotate);
//   }
//
//   function handleRotateCWClick() {
//     setScaleRotate(RENDER_OPTIONS.scale, RENDER_OPTIONS.rotate + 90);
//   }
//
//   function handleRotateCCWClick() {
//     setScaleRotate(RENDER_OPTIONS.scale, RENDER_OPTIONS.rotate - 90);
//   }
//
//   document.querySelector('.toolbar select.scale').value = RENDER_OPTIONS.scale;
//   document.querySelector('.toolbar select.scale').addEventListener('change', handleScaleChange);
//   document.querySelector('.toolbar .rotate-ccw').addEventListener('click', handleRotateCCWClick);
//   document.querySelector('.toolbar .rotate-cw').addEventListener('click', handleRotateCWClick);
// })();

// // Clear toolbar button
// (function () {
//   function handleClearClick(e) {
//     if (confirm('Are you sure you want to clear annotations?')) {
//       for (let i=0; i<NUM_PAGES; i++) {
//         document.querySelector(`div#pageContainer${i+1} svg.annotationLayer`).innerHTML = '';
//       }
//
//       localStorage.removeItem(`${RENDER_OPTIONS.documentId}/annotations`);
//     }
//   }
//   document.querySelector('a.clear').addEventListener('click', handleClearClick);
// })();

/**
 * pdf自定义事件监听
 * **/

//橘色批注圆圈按钮
document.getElementById('pdf-point').addEventListener('click',function(){
  document.querySelector('.default-toolbar').style.display = '';
});
