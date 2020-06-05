import {ProjectCategoriesHelper} from '../../../../src/app/core/configuration/project-categories-helper';
import isGeometryCategory = ProjectCategoriesHelper.isGeometryCategory;
import getFieldCategories = ProjectCategoriesHelper.getFieldCategories;
import {sameset} from 'tsfun';
import {Named, toName} from '../../../../src/app/core/util/named';
import {Treelist} from '../../../../src/app/core/configuration/treelist';
import {Category} from '../../../../src/app/core/configuration/model/category';
import getConcreteFieldCategories = ProjectCategoriesHelper.getConcreteFieldCategories;
import getRegularCategoryNames = ProjectCategoriesHelper.getRegularCategoryNames;
import getImageCategoryNames = ProjectCategoriesHelper.getImageCategoryNames;
import getTypeCategories = ProjectCategoriesHelper.getTypeCategories;
import getOverviewTopLevelCategories = ProjectCategoriesHelper.getOverviewToplevelCategories;
import getOverviewCategoryNames = ProjectCategoriesHelper.getOverviewCategoryNames;
import getOverviewCategories = ProjectCategoriesHelper.getOverviewCategories;


describe('ProjectCategoriesHelper', () => {

    const categoryTreelist: Treelist<Named> = [
        [
            { name: 'Image'},
            [
                [
                    { name: 'Drawing'},
                    []
                ]
            ]
        ],
        [
            { name: 'Operation' },
            [
                [
                    { name: 'Trench' },
                    []
                ]
            ]
        ],
        [
            { name: 'Place' },
            []
        ],
        [
            { name: 'Inscription' },
            []
        ],
        [
            { name: 'Type' },
            []
        ],
        [
            { name: 'TypeCatalog' },
            []
        ],
        [
            { name: 'Project' },
            []
        ],
        [
            { name: 'Find' },
            []
        ]
    ];


    it('isGeometryCategory', () => {

        expect(isGeometryCategory(categoryTreelist, 'Image')).toBeFalsy();
        expect(isGeometryCategory(categoryTreelist, 'Drawing')).toBeFalsy();
        expect(isGeometryCategory(categoryTreelist, 'Type')).toBeFalsy();
        expect(isGeometryCategory(categoryTreelist, 'TypeCatalog')).toBeFalsy();
        expect(isGeometryCategory(categoryTreelist, 'Inscription')).toBeFalsy();
        expect(isGeometryCategory(categoryTreelist, 'Project')).toBeFalsy();
        expect(isGeometryCategory(categoryTreelist, 'Operation')).toBeTruthy();
        expect(isGeometryCategory(categoryTreelist, 'Project')).toBeFalsy();
    });


    it('getFieldCategories', () => {

        expect(
            sameset(
                getFieldCategories(categoryTreelist as Treelist<Category>).map(toName),
                ['Operation', 'Trench', 'Inscription', 'Type', 'TypeCatalog', 'Find', 'Place'])
        ).toBeTruthy();
    });


    it('getConcreteFieldCategories', () => {

        expect(
            sameset(
                getConcreteFieldCategories(categoryTreelist as Treelist<Category>).map(toName),
                ['Operation', 'Trench', 'Inscription', 'Find', 'Place'])
        ).toBeTruthy();
    });


    it('getRegularCategoryNames', () => {

        expect(
            sameset(
                getRegularCategoryNames(categoryTreelist as Treelist<Category>),
                ['Inscription', 'Find'])
        ).toBeTruthy();
    });


    it('getImageCategoryNames', () => {

        expect(
            sameset(
                getImageCategoryNames(categoryTreelist as Treelist<Category>),
                ['Image', 'Drawing'])
        ).toBeTruthy();
    });


    it('getTypeCategories', () => {

        expect(
            sameset(
                getTypeCategories(categoryTreelist as Treelist<Category>).map(toName),
                ['TypeCatalog', 'Type'])
        ).toBeTruthy();
    });


    it('getOverviewToplevelCategories', () => {

        expect(
            sameset(
                getOverviewTopLevelCategories(categoryTreelist as Treelist<Category>).map(toName),
                ['Operation', 'Place'])
        ).toBeTruthy();
    });


    it('getOverviewCategories', () => {

        expect(
            sameset(
                getOverviewCategories(categoryTreelist as Treelist<Category>),
                ['Trench', 'Place'])
        ).toBeTruthy();
    });


    it('getOverviewCategoryNames', () => {

        expect(
            sameset(
                getOverviewCategoryNames(categoryTreelist as Treelist<Category>),
                ['Operation', 'Trench', 'Place'])
        ).toBeTruthy();
    });
});
