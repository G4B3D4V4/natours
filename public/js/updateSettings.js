import axios from 'axios';
import { showAlert } from './alerts'

export const updateData = async (data, type) => {
    try {
        const res = await axios({
            method:'PATCH',
            url: `/api/v1/users/${type ==='password'?'updatePassword':'updateMe'}`,
            data 
        });
        if (res.data.status === 'success') {
            showAlert('success', `${type.toUpperCase()} updated successfuly`);
        }
    } catch (error) {
        showAlert('error', error.response.data.message);
    }
}