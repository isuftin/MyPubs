(function() {


angular.module('pw.auth', ['ngRoute'])


.config(['$routeProvider',
	function($routeProvider) {
		$routeProvider.when('/Login', {
			templateUrl: 'mypubs/main/login.html',
			controller: 'loginCtrl',
			openAccess: true
		})
		$routeProvider.when('/Logout', {
			//templateUrl: 'mypubs/main/login.html',
			controller: 'logoutCtrl',
		})
	}
])


.run(['$rootScope', '$route', 'Authentication',
function ($rootScope, $route, auth) {

	$rootScope.$on('$routeChangeStart', function (event, next, current) {

		// TODO find a better place for this
		if ( angular.isUndefined(auth.openRoutes) ) {
			auth.openRoutes = []
			angular.forEach($route.routes, function(route, path) {
				route.openAccess && (auth.openRoutes.push(path));
			});
		}

		if (next.$$route) {
			var nextPath = next.$$route.originalPath
			if (nextPath === '/Logout') {
				auth.logout()
			}
			if ( ! auth.isLoggedIn() && ! _.contains(auth.openRoutes, nextPath) ) {
				event.preventDefault()
				auth.logout()
			}
		}
	})
}])



.controller('loginCtrl', [ '$scope', 'Authentication', function($scope, auth) {

	// TODO login user/pwd and fetch session token

	auth.setToken('token')

}])


.controller('logoutCtrl', [ '$scope','Authentication', function($scope, auth) {

	// TODO might not be needed - the route listener calls auth.logout

	auth.logout()

}])


.service('Authentication', 
['$rootScope','$location','$route',
function($scope,$location,$route) {

	var auth = this


	auth.token = 'TODO testing default loggin token'


	auth.setToken = function(token) {
		// TODO also need to send token with publication saving
		// TODO fetcher should listen for loggout and clear the cached data
		auth.token = token
		$scope.$broadcast(auth.isLoggedIn() ?'logged-in' :'logged-out')
	}


	auth.logout = function() {
		auth.setToken(undefined)
		auth.redirectOtherwise()
	}


	auth.isLoggedIn = function() {
		return angular.isDefined(auth.token)
	}


	auth.redirectOtherwise = function() {
		var otherwise = 'otherwise' // an unknown route causes the default to be reouted
		try {
			// in angular ngRoute the null route is the default/otherwise route
			otherwise = $route.routes[null].redirectTo	
		} catch (e) {} // use the default value
		$location.path(otherwise)
	}


	return auth

}])


}) ()
