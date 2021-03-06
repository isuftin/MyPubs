describe ('Tests for pw.contributors', function() {
    it('Should have a pubs contributor module', function() {
	expect(function() { angular.module('pw.contributors'); }).not.toThrow();
    });

    describe('Tests for ContributorModel', function() {
	var personData = {
	    id : 1,
	    contributorId : 10,
	    rank : 1,
	    family : 'Jones',
	    given : 'Nancy',
	    suffix : 'Ms',
	    email : 'jones@usgs.gov',
	    affiliation : {id : 1, text : 'Wisconsin Water Science Center'}
	};
	var corporationData = {
	    id : 2,
	    contributorId : 20,
	    rank : 1,
	    organization : 'Colorado Water Science Center'
	};

	beforeEach(module('pw.contributors'));

	it('Expects an empty contributor object to be created if no data is provided', inject(function(ContributorModel) {
	    var contrib = new ContributorModel();
	    expect(contrib.id).toEqual('');
	    expect(contrib.contributorId).toEqual('');
	    expect(contrib.rank).toEqual('');
	    expect(contrib.kind).toEqual('');
	}));

	it('Expects a contributor which is a Person to be created with kind equal to Person', inject(function(ContributorModel) {
	    var contrib = new ContributorModel(personData);

	    expect(contrib.id).toEqual(1);
	    expect(contrib.contributorId).toEqual(10);
	    expect(contrib.rank).toEqual(1);
	    expect(contrib.family).toEqual('Jones');
	    expect(contrib.given).toEqual('Nancy');
	    expect(contrib.suffix).toEqual('Ms');
	    expect(contrib.email).toEqual('jones@usgs.gov');
	    expect(contrib.affiliation).toEqual({id : 1, text : 'Wisconsin Water Science Center'});
	    expect(contrib.kind).toEqual('Person');
	}));

	it('Expects a contributor which is a Corporation to be created with kind equalto Corporation', inject(function(ContributorModel) {
	    var contrib = new ContributorModel(corporationData);
	    expect(contrib.id).toEqual(2);
	    expect(contrib.contributorId).toEqual(20);
	    expect(contrib.rank).toEqual(1);
	    expect(contrib.organization).toEqual('Colorado Water Science Center');
	}));

	it('Expects changeKind to modify the contributor properties to match the kind while preserving the id', inject(function(ContributorModel) {
	    var contrib = new ContributorModel();
	    contrib.kind = 'Person';
	    contrib.changeKind();
	    expect(contrib.family).toBeDefined();

	    contrib = new ContributorModel(corporationData);
	    contrib.kind = 'Person';
	    contrib.changeKind();
	    expect(contrib.id).toEqual(2);
	    expect(contrib.contributorId).toEqual('');
	    expect(contrib.organization).not.toBeDefined();
	    expect(contrib.family).toBe('');

	    contrib = new ContributorModel();
	    contrib.kind = 'Corporation';
	    contrib.changeKind();
	    expect(contrib.id).toEqual('');
	    expect(contrib.organization).toBeDefined();

	    contrib = new ContributorModel(personData);
	    contrib.kind = 'Corporation';
	    contrib.changeKind();
	    expect(contrib.id).toEqual(1);
	    expect(contrib.contributorId).toEqual('');
	    expect(contrib.organization).toBeDefined();
	    expect(contrib.family).not.toBeDefined();
	}));

	it('Expects isPerson to return whether a contributor is a person object', inject(function(ContributorModel) {
	    var contrib = new ContributorModel(personData);
	    expect(contrib.isPerson()).toBe(true);
	    contrib = new ContributorModel();
	    expect(contrib.isPerson()).toBe(false);
	    contrib = new ContributorModel(corporationData);
	    expect(contrib.isPerson()).toBe(false);
	}));

	it('Expects isCorporation to return whether a contributor is a corporation object', inject(function(ContributorModel) {
	    var contrib = new ContributorModel(personData);
	    expect(contrib.isCorporation()).toBe(false);
	    contrib = new ContributorModel();
	    expect(contrib.isCorporation()).toBe(false);
	    contrib = new ContributorModel(corporationData);
	    expect(contrib.isCorporation()).toBe(true);
	}));

	it('Expects getPubData to return an object with the contributor model specific values removed',  inject(function(ContributorModel) {
	    var contrib = new ContributorModel(personData);
	    expect(contrib.getPubData()).toEqual(personData);

	    contrib = new ContributorModel(corporationData);
	    expect(contrib.getPubData()).toEqual(corporationData);

	    contrib = new ContributorModel(personData);
	    contrib.kind = '';
	    contrib.changeKind();
	    expect(contrib.getPubData()).toEqual({
		id : 1,
		contributorId : '',
		rank : 1
	    });
	}));
    });

    describe('Tests for contributorsCtrl', function() {
	var mockLookupFetcher, mockListOrderingService, mockPubFetcher, q, rootscope;
	var createController, myCtrl;
	var ContributorModel;

	var CONTRIBUTOR_TYPES = [{id : 1, text : 'Tab1'}, {id : 2, text : 'Tab2'}, {id : 3, text : 'Tab3'}];
	var PERSONS = [{id : 1, text : 'Person1'}, {id : 2, text : 'Person2'}, {id : 3, text : 'Person3'}];
	var CORPORATIONS = [{id : 1, text : 'Corp1'}, {id : 2, text : 'Corp2'}];

	beforeEach(module('pw.contributors'));

	beforeEach(function() {
	    mockPubFetcher = {
		fetchContributor : function(contributorId) {
		    return q.when({data : {
			contributorId : contributorId,
			name : 'New Name'
		    }});
		}
	    };
	    spyOn(mockPubFetcher, 'fetchContributor').andCallThrough();

	    mockLookupFetcher = {
		promise : function(lookup) {
		    var result = [];
		    if (lookup === 'contributortypes') {
			result = CONTRIBUTOR_TYPES;
		    }
		    else if (lookup === 'people') {
			result = PERSONS;
		    }
		    else if (lookup === 'corporations') {
			result = CORPORATIONS;
		    }
		    return q.when({data : result});
		}
	    };
	    spyOn(mockLookupFetcher, 'promise').andCallThrough();

	    mockListOrderingService = jasmine.createSpyObj('mockListOrderingService', ['updateRank', 'addNewObj', 'deleteObj']);
	});

	beforeEach(inject(function($injector) {
	    var $controller;
	    rootScope = $injector.get('$rootScope');
	    scope = rootScope.$new();
	    q = $injector.get('$q');

	    ContributorModel = $injector.get('ContributorModel');

	    $controller = $injector.get('$controller');
	    createController = function() {
		return $controller('contributorsCtrl', {
		    '$scope': scope,
		    'ContributorModel' : ContributorModel,
		    'PublicationFetcher' : mockPubFetcher,
		    'LookupFetcher' : mockLookupFetcher,
		    'ListOrderingService' : mockListOrderingService
		});
	    };
	}));

	it('Expects the controller to fetch the current contributor types', function() {
	    scope.pubData = {};
	    myCtrl = createController();
	    scope.$digest();

	    expect(mockLookupFetcher.promise).toHaveBeenCalled();
	    expect(mockLookupFetcher.promise.calls[0].args).toEqual(['contributortypes']);
	    expect(scope.contribTabs.length).toBe(3);
	    expect(scope.contribTabs[0].id).toEqual(1);
	    expect(scope.contribTabs[0].text).toEqual('Tab1');
	    expect(scope.contribTabs[1].id).toEqual(2);
	    expect(scope.contribTabs[1].text).toEqual('Tab2');
	    expect(scope.contribTabs[2].id).toEqual(3);
	    expect(scope.contribTabs[2].text).toEqual('Tab3');
	});

	it('Expects that if the controller is created with the contrib properties undefined, the controller defines them and adds them to contribTabs', function() {
	    scope.pubData = {};
	    myCtrl = createController();
	    scope.$digest();

	    expect(scope.pubData.tab1).toEqual([]);
	    expect(scope.pubData.tab2).toEqual([]);
	    expect(scope.pubData.tab3).toEqual([]);

	    expect(scope.contribTabs[0].data).toEqual([]);
	    expect(scope.contribTabs[1].data).toEqual([]);
	    expect(scope.contribTabs[2].data).toEqual([]);
	});

	it('Expects that if the contrib properties are already defined the data will be preserved but ordered by rank', function() {
	    scope.pubData = {
		tab1 : [{family : 'N1', rank : 1}, {organization : 'N2', rank : 2}],
		tab2 : [{family : 'N3', rank : 1}],
		tab3 : [{family : 'N4', rank : 3}, {family : 'N5', rank : 1}, {organization : 'N6', rank : 2}]
	    };
	    myCtrl = createController();
	    scope.$digest();

	    expect(scope.pubData.tab1).toEqual([{family : 'N1', rank : 1}, {organization : 'N2', rank : 2}]);
	    expect(scope.pubData.tab2).toEqual([{family : 'N3', rank : 1}]);
	    expect(scope.pubData.tab3).toEqual([{family : 'N5', rank : 1}, {organization : 'N6', rank : 2}, {family : 'N4', rank : 3}]);

	    expect(scope.contribTabs[2].data[0].family).toEqual('N5');
	});

	it('Expects that if contrib data changes, the pubData object is updated', function() {
	    scope.pubData = {
		tab1 : [{family : 'N1', rank : 1}, {organization : 'N2', rank : 2}],
		tab2 : [{family : 'N3', rank : 1}],
		tab3 : [{family : 'N4', rank : 3}, {family : 'N5', rank : 1}, {organization : 'N6', rank : 2}]
	    };
	    myCtrl = createController();
	    scope.$digest();

	    scope.contribTabs[0].data[0].family = 'A1';
	    scope.$digest();
	    expect(scope.pubData.tab1[0].family).toEqual('A1');

	    scope.contribTabs[2].data.pop();
	    scope.$digest();
	    expect(scope.pubData.tab3.length).toBe(2);

	    scope.contribTabs[1].data.push(new ContributorModel());
	    scope.$digest();
	    expect(scope.pubData.tab2.length).toBe(2);
	});

	it('Expects the personOptions to be retrieved', function() {
	    scope.pubData = {};
	    myCtrl = createController();
	    scope.$digest();

	    expect(mockLookupFetcher.promise.calls[1].args).toEqual(['people']);
	    expect(scope.personOptions).toEqual(PERSONS);
	});

	it('Expects the corporationOptions to be retrieved', function() {
	    scope.pubData = {};
	    myCtrl = createController();
	    scope.$digest();

	    expect(mockLookupFetcher.promise.calls[2].args).toEqual(['corporations']);
	    expect(scope.corporationOptions).toEqual(CORPORATIONS);
	});

	it('Expects the sortOptions to contain a stop function which updates the currently selected tab\'s data', function() {
	    scope.pubData = {
		tab1 : [{family : 'N1', rank : 1}, {organization : 'N2', rank : 2}],
		tab2 : [{family : 'N3', rank : 1}],
		tab3 : [{family : 'N4', rank : 3}, {family : 'N5', rank : 1}, {organization : 'N6', rank : 2}]
	    };
	    myCtrl = createController();
	    scope.$digest();

	    expect(scope.sortOptions.stop).toBeDefined();

	    scope.selectedTab(1);
	    scope.sortOptions.stop();
	    expect(mockListOrderingService.updateRank).toHaveBeenCalled();
	    expect(mockListOrderingService.updateRank.calls[0].args[0][0].family).toEqual('N3');

	    scope.selectedTab(2);
	    scope.sortOptions.stop();
	    expect(mockListOrderingService.updateRank.calls[1].args[0][0].family).toEqual('N5');
	});

	it('Expects a call to deleteContributor uses the ListOrderingService to delete the object from the selected tab', function() {
	    scope.pubData = {
		tab1 : [{family : 'N1', rank : 1}, {organization : 'N2', rank : 2}],
		tab2 : [{family : 'N3', rank : 1}],
		tab3 : [{family : 'N4', rank : 3}, {family : 'N5', rank : 1}, {organization : 'N6', rank : 2}]
	    };
	    myCtrl = createController();
	    scope.$digest();

	    scope.selectedTab(0);
	    scope.deleteContributor(1);
	    expect(mockListOrderingService.deleteObj).toHaveBeenCalled();
	    expect(mockListOrderingService.deleteObj.calls[0].args[0][0].family).toEqual('N1');

	    scope.selectedTab(2);
	    scope.deleteContributor(0);
	    expect(mockListOrderingService.deleteObj).toHaveBeenCalled();
	});

	it('Expects a call to addContributor to use the ListOrderingService to append a new object to the selected tab\'s data', function() {
	    scope.pubData = {
		tab1 : [{family : 'N1', rank : 1}, {organization : 'N2', rank : 2}],
		tab2 : [{family : 'N3', rank : 1}],
		tab3 : [{family : 'N4', rank : 3}, {family : 'N5', rank : 1}, {organization : 'N6', rank : 2}]
	    };
	    myCtrl = createController();
	    scope.$digest();

	    scope.selectedTab(2);
	    scope.addContributor();
	    expect(mockListOrderingService.addNewObj.calls[0].args[0][0].family).toEqual('N5');

	    scope.selectedTab(1);
	    scope.addContributor();
	    expect(mockListOrderingService.addNewObj.calls[1].args[0][0].family).toEqual('N3');
	});

	it('Expects a call to updateContributorInfo to retrieve the full contributor info and update the pubsData', function() {
	    scope.pubData = {
		tab1 : [{contributorId : 1, family : 'N1', rank : 1}, {contributorId : 2, family : 'N2', rank : 2}],
		tab2 : [{contributorId : 3, family : 'N3', rank : 1}]
	    };
	    myCtrl = createController();
	    scope.$digest();
	    scope.selectedTab(0);
	    scope.updateContributorInfo(1);

	    expect(mockPubFetcher.fetchContributor).toHaveBeenCalledWith(2);
	    scope.$digest();
	    expect(scope.contribTabs[0].data[1].name).toEqual('New Name');
	});
    });
});