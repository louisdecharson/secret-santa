export default function getBaseURL(): string {
    return location.protocol + '//' + location.host;
}
