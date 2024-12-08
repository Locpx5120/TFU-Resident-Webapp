import {Dayjs} from "dayjs";
import {NotificationTypeList, statusTypeList} from "./NewsConstant";

export const convertObjectToFormData = (obj, form = new FormData(), namespace = '') => {
    for (const key in obj) {
        if (obj.hasOwnProperty(key)) {
            const value = obj[key];
            const formKey = namespace ? `${namespace}[${key}]` : key;
            if (value instanceof Date) {
                form.append(formKey, value.toISOString());
            } else if (value instanceof Array) {
                value.forEach((item, index) => {
                    convertObjectToFormData({[index]: item}, form, formKey);
                });

            } else if (value instanceof Blob) {
                console.log(value)
                form.append(formKey, value, 'uploadImage.jpg')
            } else if (typeof value === 'object' && value !== null) {
                convertObjectToFormData(value, form, formKey);
            } else {
                form.append(formKey, value);
            }
        }
    }
    return form;
}
export const convertNewObj = (obj) => {
    return {
        notificationType: obj.notificationType,
        applyTime: obj.applyTime,
        BuildingId: obj.building,
        RoleId: obj.role,
        Title: obj.title,
        Image: obj.image,
        shortContent: obj.content,
        longContent: obj.detailContent,
        Status: obj.status
    }
}
export const mapNotificationTypeName = (params) => {
    // console.log(statusTypeList.find(el => el.value === params).label)
    return statusTypeList.find(el => el.value === params) ? statusTypeList.find(el => el.value === params).label : '';
}
export const mapNotificationName = (params) => {
    return NotificationTypeList.find(el => el.value === params) ? NotificationTypeList.find(el => el.value === params).label : '';
}