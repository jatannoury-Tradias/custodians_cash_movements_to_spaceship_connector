import pandas as pd
import requests


def authenticate(env):
    return requests.post(f"https://{env}.tradias.link/api/authenticate", json={
        "email": "admin@tradias.de",
        "secret": "admin@tradias.de"
    }).json()["auth_token"]


def migrate_custodians(env, csv_path):
    token = authenticate(env)
    df = pd.read_excel(csv_path)
    custodians = list(df['Custodian'].unique())
    for custodian in custodians:
        res = requests.post(f"https://{env}.tradias.link/api/custodians/",
                            headers={
                                "Authorization": f"Bearer {token}",
                            },
                            json={
                                "address":"0, ., .",
                                "email":f"{''.join(custodian.casefold().split())}@tradias.link",
                                "name":custodian,
                                "phone":"0"
                            }
                            )



if __name__ == "__main__":
    migrate_custodians("uat", r"C:\Users\jtannoury\Downloads\Mapping Spaceship - Set up wallets - UAT.xlsx")
