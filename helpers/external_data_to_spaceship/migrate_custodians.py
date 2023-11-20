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
                                "address": "0, ., .",
                                "email": f"{''.join(custodian.casefold().split())}@tradias.link",
                                "name": custodian,
                                "phone": "0"
                            }
                            )


def migrate_clients(env, csv_path):
    token = authenticate(env)
    df = pd.read_excel(csv_path)
    clients = list(df['Account Holder'].unique())
    for client in clients:
        res = requests.post(f"https://{env}.tradias.link/api/clients/",
                            headers={
                                "Authorization": f"Bearer {token}",
                            },
                            json={
                              "name": client,
                              "email": f"{''.join(client.casefold().split())}@tradias.link",
                              "phone": "0",
                              "address": "0, 0, 0",
                              "tier_id": "",
                              "tolerance_factor": "",
                              "trading_halt": False,
                              "initial_margin": "",
                              "client_legacy_id": ""
                            }
                )
        if res.status_code == 201:
            print("Client Added:",client)
        elif res.status_code == 409:
            print("Duplicate Client:",client)
        else:
            pass
    pass


if __name__ == "__main__":
    migrate_clients("uat", r"C:\Users\jtannoury\Downloads\Mapping Spaceship - Set up wallets - UAT.xlsx")
