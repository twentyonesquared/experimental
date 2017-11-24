var app = angular.module('plunker', []);
//scope.standard = 'A';

app.controller('colourCtrl', function($scope) {
  $scope.wai = {
    'standard' : 'none',
    'reverse': false
  };
  
  $scope.colours = palette;
});


// SERVICE
app.service('colourConverterService', function() {
  var contrast;
  var hexDigits = new Array('0', '1', '2', '3', '4', '5', '6', '7', '8', '9', 'a', 'b', 'c', 'd', 'e', 'f');
  var converted='';
  
  function rgb2hex(rgb) {
    rgb = rgb.match(/^rgb\((\d+),\s*(\d+),\s*(\d+)\)$/);
    return hex(rgb[1]) + hex(rgb[2]) + hex(rgb[3]);
  }

  function shadeRGBColor(color, percent) {
    color = color.replace(/\s/g,'');
    return shadeBlend(percent, color);
  }

  function shadeBlend(p,c0,c1) {
    var n=p<0?p*-1:p,
      u=Math.round,
      w=parseInt,
      f;
    if(c0.length>7){
      f=c0.split(','),
      t=(c1?c1:p<0?'rgb(0,0,0)':'rgb(255,255,255)').split(','),
      R=w(f[0].slice(4)),
      G=w(f[1]),
      B=w(f[2]);
      return 'rgb('+(u((w(t[0].slice(4))-R)*n)+R)+','+(u((w(t[1])-G)*n)+G)+','+(u((w(t[2])-B)*n)+B)+')';
    }else{
      f=w(c0.slice(1),16),
      t=w((c1?c1:p<0?'#000000':'#FFFFFF').slice(1),16),
      R1=f>>16,
      G1=f>>8&0x00FF,
      B1=f&0x0000FF;
      return '#'+(0x1000000+(u(((t>>16)-R1)*n)+R1)*0x10000+(u(((t>>8&0x00FF)-G1)*n)+G1)*0x100+(u(((t&0x0000FF)-B1)*n)+B1)).toString(16).slice(1);
    }
  }

  function hexToR(h) {
    return parseInt((cutHex(h)).substring(0,2),16);
  }
  function hexToG(h) {
    return parseInt((cutHex(h)).substring(2,4),16);
  }
  function hexToB(h) {
    return parseInt((cutHex(h)).substring(4,6),16);
  }
  function cutHex(h) {
    return (h.charAt(0)=='#') ? h.substring(1,7):h;
  }

  function hex(x) {
    return isNaN(x) ? '00' : hexDigits[(x - x % 16) / 16] + hexDigits[x % 16];
  }

  function getContrast(hexcolour, elem) {
    var r = parseInt(hexcolour.substr(0, 2), 16);
    var g = parseInt(hexcolour.substr(2, 2), 16);
    var b = parseInt(hexcolour.substr(4, 2), 16);

    var yiq1 = ((r * 299) + (g * 587) + (b * 114)) / 1000; // As quoted by WAI
    var yiq2 = (0.2126 * r + 0.7152 * g + 0.0722 * b);

    //return (yiq2 >= 127) ? 'black' : 'white';
    return (yiq1 >= 128) ? 'black' : 'white';
  }

  function luminanace(r, g, b) {
    var a = [r,g,b].map(function(v) {
      v /= 255;
      return (v <= 0.03928) ?
        v / 12.92 :
        Math.pow( ((v+0.055)/1.055), 2.4 );
      });
    return a[0] * 0.2126 + a[1] * 0.7152 + a[2] * 0.0722;
  }

  function splitRGB(rgb){
    var cols = rgb.replace('rgba(', '').replace('rgb(', '').replace(')', '').split(' ').join('').split(',');
    cols[0] = Number(cols[0]);
    cols[1] = Number(cols[1]);
    cols[2] = Number(cols[2]);
    return(cols);
  }

  function colourCheck(bg, fg){
    var bgparts = splitRGB(bg);
    var fgparts = splitRGB(fg);
    var bgluminance = luminanace(bgparts[0],bgparts[1],bgparts[2])+0.05;
    var fgluminance = luminanace(fgparts[0],fgparts[1],fgparts[2])+0.05;
    var contrastRatio = bgluminance/fgluminance;
    if (fgluminance > bgluminance) {
      contrastRatio = 1 / contrastRatio;
    }
    return(Math.round(contrastRatio*100)/100);
  }


  function layerCompile(bg, fg){

    var bgcols=bg.replace('rgba(','').replace('rgb(','').replace(')','').split(' ').join('').split(',');
    bgcols[0] = Number(bgcols[0])/255;
    bgcols[1] = Number(bgcols[1])/255;
    bgcols[2] = Number(bgcols[2])/255;

    var fgcols=fg.replace('rgba(','').replace('rgb(','').replace(')','').split(' ').join('').split(',');
    fgcols[0] = Number(fgcols[0])/255;
    fgcols[1] = Number(fgcols[1])/255;
    fgcols[2] = Number(fgcols[2])/255;
    fgcols[3] = 255-(Number(fgcols[3])*255);

    var targetR = Math.floor(((1 - fgcols[3]) * fgcols[0]) + (fgcols[3] * bgcols[0]));
    var targetG = Math.floor(((1 - fgcols[3]) * fgcols[1]) + (fgcols[3] * bgcols[1]));
    var targetB = Math.floor(((1 - fgcols[3]) * fgcols[2]) + (fgcols[3] * bgcols[2]));

    return 'rgb('+targetR+','+targetG+','+targetB+')';
  }

  function applyColour(bg, fg, standard, oldColours){
    var colours = {
      'BG':bg,
      'FG':fg
    };
    var newColours = oldColours|| {
      'BG': null,
      'FG': null
    };
    var newBG;
    var newFG;

    var bgparts = splitRGB(colours.BG);
    var fgparts = splitRGB(colours.FG);

    var bgluminance = luminanace(bgparts[0],bgparts[1],bgparts[2])+0.05;
    var fgluminance = luminanace(fgparts[0],fgparts[1],fgparts[2])+0.05;

    if(bgluminance > 0.05){
      if(bgluminance < fgluminance){
        bgDiff = -0.01;
        fgDiff = 0.01;
      }else{
        bgDiff = 0.01;
        fgDiff = -0.01;
      }
    } else {
      if(bgluminance > fgluminance){
        bgDiff = 0.01;
        fgDiff = -0.01;
      }else{
        bgDiff = -0.01;
        fgDiff = 0.01;
      }
    }

    // Darken background first
    contrast = colourCheck(colours.BG, colours.FG);
    if(contrast <= standard) {
      newBG = shadeRGBColor(colours.BG, bgDiff);
      newFG = shadeRGBColor(colours.FG, fgDiff);
      newColours = {
        'BG':newBG,
        'FG':newFG
      };

      applyColour(newBG, newFG, standard, newColours);
    } else {
      newBG = colours.BG;
      newFG = colours.FG;
      newColours = {
        'BG':newBG,
        'FG':newFG
      };
    }

    converted = converted === ''? newColours:converted;
    return converted;
  }

  this.convertColour = function() {
    converted = '';

    return applyColour.apply(this, arguments);
  };
});



// DIRECTIVE
app.directive('waiStandard', function($compile) {
  var Defaultstandard = 0;
  var Astandard = 1.8;
  var AAstandard = 4.58;
  var AAAstandard = 7.01;
  
  var standards = {
      default: 0,
      A: 1.8,
      AA: 4.58,
      AAA: 7.01
  }

  function changeColour(scope, elem, attrs) {
    var element = $(elem);
    var bg;
    var fg;
    
    var initBG = element.css('background-color') || '#000000';
    var initFG = element.css('color') || '#ffffff';
    
    var elementReverse = element.attr('reverse') || 'false';

    if(!scope.wai.reverse){
      bg = elementReverse == 'false'? initBG:initFG;
      fg = elementReverse == 'false'? initFG:initBG;
    }else{
      fg = elementReverse == 'false'? initBG:initFG;
      bg = elementReverse == 'false'? initFG:initBG;
    }
    var standardChosen = attrs.waiStandard || 'none';

    var standard = standards[standard] || standards.default;
    
    
    var coloursToAssign = standardsColour(bg, fg, standard);
    scope.BG=coloursToAssign.BG;
    scope.FG=coloursToAssign.FG;
    scope.standardChosen = standardChosen;
    element.css({
      'background-color': coloursToAssign.BG,
      'color': coloursToAssign.FG
    });
  }
  
  return {
    restrict: 'A',
    controller: function($scope, $element, colourConverterService) {
      standardsColour=$scope.standardsColour || colourConverterService.convertColour;

      $scope.changestandard = function(newValue){
        if($scope.wai.standard !== newValue){
          $scope.wai.standard=newValue;
        }
        
        if(newValue == 'none'){
          $scope.wai.reverse = false;
        }
      };
      
      $scope.reversecolours = function(){
        $scope.wai.reverse = !$scope.wai.reverse;
      };
    },
    

    link: function(scope, elem, attrs) {
      console.log('init', scope);
      
      
      
    
      
      changeColour(scope, elem, attrs);
      scope.$watch('wai.standard', function(newVal, oldVal) {
        if(newVal !== oldVal){
          elem.removeAttr('style');
          if(newVal == 'none'){
            elem.removeAttr('reverse');
          }
          changeColour(scope, elem, attrs);
        }
      });
      
      elem.on('click', function(){
        if(elem.attr('reverse')!=='true'){
          elem.attr('reverse', 'true');
        }else{
          elem.attr('reverse', 'false');
        }
        elem.removeAttr('style');
          changeColour(scope, elem, attrs);
      });
      
      scope.$watch('wai.reverse', function(newVal, oldVal) {
        if(newVal !== oldVal){
          elem.removeAttr('style');
          changeColour(scope, elem, attrs);

        }
      });
    }
  };
});