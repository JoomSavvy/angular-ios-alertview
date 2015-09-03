angular.module('ios-alertview', [])
.directive('iosAlertView', function(){
  return {
    restrict: 'AE',
    replace: true,
    template: [
      '<div class="ios-alertview-overlay">',
        '<div class="ios-alertview">',
          '<div class="ios-alertview-inner" ng-class="{\'ios-alertview-inner-remind\': !buttons || !buttons.length}">',
            '<div class="ios-alertview-title" ng-if="title">{{ title }}</div>',
            '<div class="ios-alertview-text" ng-bind-html="renderHtml(text)" ng-if="text"></div>',
            '<input class="ios-alertview-text-input" type="{{ inputType }}" placeholder="{{ inputPlaceholder }}" ng-model="form.inputValue" ng-if="input" />',
          '</div>',
          '<div class="ios-alertview-buttons" ng-if="buttons.length" ng-class="{\'ios-alertview-buttons-horizontal\': buttons.length <= 2}">',
            '<span class="ios-alertview-button" ng-class="{\'ios-alertview-button-bold\': button.bold}" ng-repeat="button in buttons" ng-click="onClick($index, button)">{{ button.text }}</span>',
          '</div>',
        '</div>',
      '</div>'
    ].join(''),
    controller: ['$scope', '$sce',  function($scope, $sce){
      $scope.renderHtml = function(html_code){
        return $sce.trustAsHtml(html_code);
      }
    }]
  };
})
.provider('iosAlertView', function (){
  var options = {
    title: null,
    text: null,
    input: false,
    inputType: 'text',
    inputPlaceholder: '',
    cancelText: 'Cancel',
    okText: 'OK'
  };
  var keys = Object.keys(options);
  var self = this;
  self.set = function(key, value){
    if(angular.isObject(key)){
      for(var name in key){
        self.set(name, key[name]);
      }
    }else{
      if(key && (keys.indexOf(key) > -1)){
        if(value){
          options[key] = value;
        }
      }
    }
  };

  this.$get = [
    '$rootScope',
    '$compile',
    '$animate',
    '$q',
    '$document',
    '$timeout',
    '$log',
    function($rootScope, $compile, $animate, $q, $document, $timeout, $log){

      function AlertView(option){

        // expect option is object
        if(!angular.isObject(option)){
          $log.error('AlertView expect object option');
          return $q.when();
        }

        var deferred = $q.defer();
        var $scope = $rootScope.$new(true);
        angular.extend($scope, options, option, {form: {}});
        var $element = $compile('<div ios-alert-view></div>')($scope);

        $scope.onClick = function(index, button){

          var inputValue = $scope.form.inputValue;
          var cbkData = {
            index: index,
            button: button,
            inputValue: inputValue
          };

          if(angular.isFunction(button.onClick)){
            button.onClick(cbkData);
          }

          $animate.leave($element).then(function(){
            deferred.resolve(cbkData);
          });
        };

        $animate.enter($element, $document[0].body);

        if(!$scope.buttons || !$scope.buttons.length){
          // if no buttons, remove modal in 650ms
          $timeout(function(){
            $animate.leave($element).then(function(){
              deferred.resolve();
            });
          }, 650 /* 450ms animation time + 250ms show time */);
        }

        return deferred.promise;
      }

      function objectify(option){
        if(angular.isString(option)){
          return {
            text: option
          };
        }else if(angular.isObject(option)){
          return option;
        }else{
          $log.error('expect a string or an object');
          return {};
        }
      }

      function alert(option){
        var deferred = $q.defer();
        option = objectify(option);
        option = angular.extend({}, options, option);
        option = angular.extend(option, {
          buttons: [{
            text: option.okText,
            onClick: deferred.resolve,
            bold: true
          }]
        });
        AlertView(option).then(deferred.resolve, deferred.reject);
        return deferred.promise;
      }

      function confirm(option){
        var deferred = $q.defer();
        option = objectify(option);
        option = angular.extend({}, options, option);
        option = angular.extend(option, {
          buttons: [
            {
              text: option.cancelText,
              onClick: deferred.reject
            },
            {
              text: option.okText,
              onClick: deferred.resolve,
              bold: true
            }
          ]
        });
        AlertView(option).then(deferred.resolve, deferred.reject);
        return deferred.promise;
      }

      function prompt(option){
        var deferred = $q.defer();
        option = objectify(option);
        option = angular.extend({}, options, option);
        option = angular.extend(option, {
          input: true,
          buttons: [
            {
              text: option.cancelText,
              onClick: deferred.reject
            },
            {
              text: option.okText,
              onClick: function(data){
                deferred.resolve(data.inputValue);
              },
              bold: true
            }
          ]
        });
        AlertView(option).then(function(data){
          deferred.resolve(data.inputValue);
        }, deferred.reject);
        return deferred.promise;
      }

      function remind(option){
        var deferred = $q.defer();
        option = objectify(option);
        option = angular.extend({}, options, option);
        AlertView(option).then(deferred.resolve, deferred.reject);
        return deferred.promise;
      }

      return {
        AlertView: AlertView,
        alert: alert,
        confirm: confirm,
        prompt: prompt,
        remind: remind
      };
    }
  ];
});
