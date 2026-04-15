import requests

url = 'http://127.0.0.1:8000/score'
files = {'file': open('test_resume.txt', 'rb')}
data = {
    'job_text': 'Looking for a data engineer with Python, AWS, Docker, 2+ years experience',
    'model_name': 'all-MiniLM-L6-v2',
    'weights': '{"skills":0.4,"experience":0.2,"education":0.1,"semantic":0.2,"title":0.05,"bonus":0.05}'
}

resp = requests.post(url, files=files, data=data)
print('status:', resp.status_code)
try:
    print(resp.json())
except Exception:
    print(resp.text)
