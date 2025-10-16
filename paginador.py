import streamlit as st
import math

def paginate_dataframe(dataframe):

    if not hasattr(st, 'session_state'):
        st.session_state = {}

    # Define a quantidade de itens por página
    items_per_page = st.selectbox("Itens por página:", [10, 25, 50, 100], index=1)
    
    total_rows = len(dataframe)
    total_pages = math.ceil(total_rows / items_per_page) if items_per_page > 0 else 1

    # Garante que a página atual seja armazenada no estado da sessão
    if 'current_page' not in st.session_state:
        st.session_state.current_page = 1

    # Garante que a página atual não exceda o total de páginas
    if st.session_state.current_page > total_pages:
        st.session_state.current_page = total_pages

    def previous_page():
        if st.session_state.current_page > 1:
            st.session_state.current_page -= 1

    def next_page():
        if st.session_state.current_page < total_pages:
            st.session_state.current_page += 1

    # Layout dos controles de paginação
    col1, col2, col3, col4 = st.columns([3, 2, 2, 3])

    with col1:
        st.button("⬅️ Anterior", on_click=previous_page, use_container_width=True)
    
    with col2:
        # Seletor de página
        page_selection = st.number_input(
            "Página",
            min_value=1,
            max_value=total_pages,
            key='current_page',
            label_visibility="collapsed"
        )
    
    with col3:
        st.button("Próximo ➡️", on_click=next_page, use_container_width=True)

    with col4:
        st.markdown(f"<div style='text-align: right;'>Página {st.session_state.current_page} de {total_pages}</div>", unsafe_allow_html=True)
    
    # Fatiar o dataframe para exibir a página atual
    start_index = (st.session_state.current_page - 1) * items_per_page
    end_index = start_index + items_per_page
    df_to_show = dataframe.iloc[start_index:end_index]

    st.dataframe(df_to_show, use_container_width=True)