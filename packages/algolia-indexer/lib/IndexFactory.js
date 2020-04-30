const algoliaSearch = require('algoliasearch');

// Any defined settings will override those in the algolia UI
// TODO: make this a custom setting
const REQUIRED_SETTINGS = {
    // We chunk our pages into small algolia entries, and mark them as distinct by slug
    // This ensures we get one result per page, whichever is ranked highest
    distinct: true,
    attributeForDistinct: `slug`,
    // This ensures that chunks higher up on a page rank higher
    customRanking: [`desc(customRanking.heading)`, `asc(customRanking.position)`],
    // Defines the order algolia ranks various attributes in
    searchableAttributes: [`title`, `headings`, `html`, `url`, `tags.name`, `tags`, `authors.name`, `authors`],
    // Add slug to attributes we can filter by in order to find fragments to remove/delete
    attributesForFaceting: [`filterOnly(slug)`]
};

const AlgoliaError = ({code, statusCode, originalError}) => {
    let error = new Error('Error processing Algolia');

    error.errorType = 'AlgoliaError';
    error.code = code;
    if (statusCode) {
        error.status = statusCode;
    }
    if (originalError.message) {
        error.message = originalError.message;
    }
    error.originalError = originalError;

    return error;
};

class IndexFactory {
    constructor(algoliaSettings = {}) {
        if (!algoliaSettings.apiKey || !algoliaSettings.appId || !algoliaSettings.index || algoliaSettings.index.length < 1) {
            throw new Error('Algolia appId, apiKey, and index is required!');
        }
        this.index = [];
        this.options = algoliaSettings;

        this.options.indexSettings = algoliaSettings.indexSettings || REQUIRED_SETTINGS;
    }

    initClient() {
        this.client = algoliaSearch(this.options.appId, this.options.apiKey);
    }

    initIndex() {
        this.initClient();
        this.index = this.client.initIndex(this.options.index);
    }

    async setSettingsForIndex() {
        try {
            await this.initIndex(); //initiate client
            await this.index.setSettings(this.options.indexSettings);
            return await this.index.getSettings();
        } catch (error) {
            throw AlgoliaError({code: error.code, statusCode: error.status, originalError: error});
        }
    }

    async save(fragments) {
        console.log(`Saving ${fragments.length} fragments`); // eslint-disable-line no-console
        try {
            await this.index.saveObjects(fragments);
        } catch (error) {
            throw AlgoliaError({code: error.code, statusCode: error.status, originalError: error});
        }
    }

    async delete(slug) {
        console.log(`Deleting all fragments with slug "${slug}"`); // eslint-disable-line no-console
        try {
            await this.index.deleteBy({filters: `slug:${slug}`});
        } catch (error) {
            throw AlgoliaError({code: error.code, statusCode: error.status, originalError: error});
        }
    }
}

module.exports = IndexFactory;
