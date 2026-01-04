/**
 * Utility to sanitize objects for Firestore.
 * Firestore does not accept 'undefined' values.
 * This function recursively removes keys with 'undefined' values
 * or converts them to null if specified (default behavior is remove).
 */
export const sanitizeFirestoreData = (data: any): any => {
    if (data === null || data === undefined) {
        return null;
    }

    if (Array.isArray(data)) {
        return data.map(item => sanitizeFirestoreData(item));
    }

    if (typeof data === 'object') {
        const newObj: any = {};
        for (const key in data) {
            const value = data[key];
            if (value !== undefined) {
                newObj[key] = sanitizeFirestoreData(value);
            }
        }
        return newObj;
    }

    return data;
};
