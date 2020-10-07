import { Redis } from '../Redis';
import moment, { Moment } from 'moment';
import { limitStatus, tokenStatusInterface } from '../requestLimiter';

class User {

    public static async tokenStatus(token: string): Promise<tokenStatusInterface> {
        try {
            const timeStamp = moment.utc();
            // get limit status for token
            const tokenStatus = await limitStatus(token, timeStamp);
            return tokenStatus;
        } catch (error) {
            throw error;
        }

    }

}

export { User };